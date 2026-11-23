---
name: readovo-lesson-media
description: Generate or source Readovo vocabulary and thematic lesson images, match them to stored object keys, and upload authorized media to the Readovo development R2 bucket. Use for lesson content images and image exercise options.
---

# Readovo lesson media

Read [Development Lesson Media](../../../README.md#development-lesson-media) and check the current lesson or sample seed for the exact object keys. For the Oktoberfest A1 sample, start with [its vocabulary seed](../../../backend/prisma/seeds/learning/oktoberfest-vocabulary.ts). Use existing keys for missing files. If replacing an existing image, propose a new key and identify the content records that need the new key.

## Prepare images

- Source PNG keys and prompts for existing art are recorded under [topic covers](../../../docs/learning-media/topic-covers.md) and [lesson artwork](../../../docs/learning-media/lesson-art.md). Download the source from private R2 into a temporary directory when preparing a new rendition.
- Use ImageGen for generated educational images. For real photos, verify reuse rights on each original file or source page before using it. Record the source URL, license and required attribution. For generated images, record that they were generated and retain the prompt as provenance.
- For exercise options, use comparable crops and dimensions. Make each target recognizable at phone-card size and keep option labels out of the image. Inspect the rendered files. Match the actual encoding and MIME type to each key's extension.
- Deliver vocabulary cards and picture choices as versioned WebP files with `Content-Type: image/webp`. Use the `vocabulary` preset in [prepare_artwork.py](scripts/prepare_artwork.py) for up to 512 px on the longest edge, without cropping. Keep source PNGs under their existing keys and switch word records only after verifying the new WebP objects.
- Keep work files in a temporary directory. Report each completed image with its object key and provenance. Update lesson content records only when the request includes that work. Development seed material requires separate approval for production use.

### Catalogue and full-size artwork

Use Python with Pillow (WebP support) and [prepare_artwork.py](scripts/prepare_artwork.py) to encode each rendition directly from the source. Pick `topic-thumbnail` for a proportional cover at up to 960 px wide, `lesson-thumbnail` for a square crop at up to 256 × 256 px, and `cover` for a proportional full image at up to 1280 px wide. Inspect the square crop and adjust `--centering X Y` if needed.

```powershell
python .agents/skills/readovo-lesson-media/scripts/prepare_artwork.py original.png thumbnail.webp --preset lesson-thumbnail
```

Upload WebP files with `Content-Type: image/webp`. Give the catalogue and full-size renditions distinct versioned keys, then verify every required object before changing the database pointers. Topics use `thumbnailImageKey` in the catalogue and `coverImageKey` for full covers. Lessons use their own `thumbnailImageKey` alongside optional reading and results artwork.

## Upload to development R2

Upload when requested and target the team's private `readovo-media` bucket. Only maintainers who upload images need AWS CLI v2 and the local `readovo-r2-dev` profile. The bucket owner provides a Cloudflare R2 **Object Read & Write** token scoped to that bucket. Configure the profile outside the repository with `aws configure --profile readovo-r2-dev`. Use the R2 S3 endpoint and `--region auto`. The local backend's `R2_ENDPOINT` can supply the endpoint. Keep the backend's read-only credentials separate. If the CLI or scoped profile is missing, report the setup needed and keep the prepared images available.

Use conditional puts so retries and existing objects are safe. In PowerShell, pass the verified image path, exact object key and actual MIME type as separate arguments.

```powershell
aws --profile readovo-r2-dev --region auto --endpoint-url $readovoR2Endpoint s3api put-object --bucket readovo-media --key $readovoImageKey --body $readovoImagePath --content-type $readovoImageMimeType --if-none-match '*'
```

Verify uploads with authenticated `aws s3api get-object` using the same profile, endpoint, bucket and key. Download to a temporary file and compare its SHA-256 with the prepared image. For an existing key or an ambiguous upload result, run the same check before retrying. Treat a matching object as already uploaded. For different bytes at the same key, report the conflict and use a new versioned key only when the caller has authorized the replacement. Report the verified object keys and any failures so a partial batch can be resumed.

Keep credentials outside chat, generated artifacts and committed files. See [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/) and [conditional operations](https://developers.cloudflare.com/r2/api/s3/api/).
