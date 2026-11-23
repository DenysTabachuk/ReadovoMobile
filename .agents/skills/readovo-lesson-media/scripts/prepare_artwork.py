"""Prepare a versioned WebP rendition of an existing Readovo illustration."""

import argparse
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps


TOPIC_THUMBNAIL_WIDTH = 960
LESSON_THUMBNAIL_SIZE = 256
COVER_WIDTH = 1280
VOCABULARY_MAX_EDGE = 512
WEBP_QUALITY = 80
WEBP_METHOD = 6
RESAMPLING = Image.Resampling.LANCZOS


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--preset",
        required=True,
        choices=("topic-thumbnail", "lesson-thumbnail", "cover", "vocabulary"),
    )
    parser.add_argument(
        "--centering",
        nargs=2,
        type=float,
        metavar=("X", "Y"),
        help="Optional crop alignment from 0 to 1 for a lesson thumbnail.",
    )
    args = parser.parse_args()
    if args.output.suffix.lower() != ".webp":
        parser.error("output must end in .webp")
    if args.centering is not None and (
        args.preset != "lesson-thumbnail"
        or any(not 0 <= value <= 1 for value in args.centering)
    ):
        parser.error("--centering requires a lesson thumbnail and two values from 0 to 1")

    with Image.open(args.source) as original:
        oriented = ImageOps.exif_transpose(original)
        mode = "RGBA" if oriented.has_transparency_data else "RGB"
        rendition = oriented.convert(mode)

    if args.preset == "lesson-thumbnail":
        side = min(LESSON_THUMBNAIL_SIZE, *rendition.size)
        rendition = ImageOps.fit(
            rendition,
            (side, side),
            method=RESAMPLING,
            centering=tuple(args.centering or (0.5, 0.5)),
        )
    elif args.preset == "vocabulary":
        rendition.thumbnail((VOCABULARY_MAX_EDGE, VOCABULARY_MAX_EDGE), RESAMPLING)
    else:
        max_width = TOPIC_THUMBNAIL_WIDTH if args.preset == "topic-thumbnail" else COVER_WIDTH
        rendition.thumbnail((max_width, rendition.height), RESAMPLING)

    buffer = BytesIO()
    rendition.save(buffer, "WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
    with args.output.open("xb") as output:
        output.write(buffer.getbuffer())
    print(f"{args.output.name}: {rendition.width}x{rendition.height}, {buffer.tell()} bytes")


if __name__ == "__main__":
    main()
