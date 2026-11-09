-- CreateEnum
CREATE TYPE "vocabulary_level" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "vocabulary_stage_kind" AS ENUM ('learn', 'practice');

-- CreateEnum
CREATE TYPE "vocabulary_exercise_kind" AS ENUM ('word_to_picture', 'audio_to_picture', 'sentence_gap');

-- CreateTable
CREATE TABLE "vocabulary_lessons" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "level" "vocabulary_level" NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_lesson_translations" (
    "lesson_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "vocabulary_lesson_translations_pkey" PRIMARY KEY ("lesson_id","locale")
);

-- CreateTable
CREATE TABLE "vocabulary_lesson_words" (
    "lesson_id" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "transcription" TEXT NOT NULL,
    "translation_uk" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "example_translation_uk" TEXT NOT NULL,
    "image_key" TEXT NOT NULL,
    "image_source_url" TEXT NOT NULL,
    "image_license" TEXT NOT NULL,
    "image_attribution" TEXT NOT NULL,

    CONSTRAINT "vocabulary_lesson_words_pkey" PRIMARY KEY ("lesson_id","id")
);

-- CreateTable
CREATE TABLE "vocabulary_lesson_stages" (
    "lesson_id" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "vocabulary_stage_kind" NOT NULL,

    CONSTRAINT "vocabulary_lesson_stages_pkey" PRIMARY KEY ("lesson_id","id")
);

-- CreateTable
CREATE TABLE "vocabulary_stage_translations" (
    "lesson_id" UUID NOT NULL,
    "stage_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "vocabulary_stage_translations_pkey" PRIMARY KEY ("lesson_id","stage_id","locale")
);

-- CreateTable
CREATE TABLE "vocabulary_stage_words" (
    "lesson_id" UUID NOT NULL,
    "stage_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "vocabulary_stage_words_pkey" PRIMARY KEY ("lesson_id","stage_id","word_id")
);

-- CreateTable
CREATE TABLE "vocabulary_exercises" (
    "lesson_id" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "vocabulary_exercise_kind" NOT NULL,
    "correct_word_id" TEXT NOT NULL,
    "sentence_before" TEXT,
    "sentence_after" TEXT,
    "sentence_translation_uk" TEXT,

    CONSTRAINT "vocabulary_exercises_pkey" PRIMARY KEY ("lesson_id","id")
);

-- CreateTable
CREATE TABLE "vocabulary_exercise_options" (
    "lesson_id" UUID NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "vocabulary_exercise_options_pkey" PRIMARY KEY ("lesson_id","exercise_id","word_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_lessons_slug_key" ON "vocabulary_lessons"("slug");

-- CreateIndex
CREATE INDEX "vocabulary_lessons_level_published_at_idx" ON "vocabulary_lessons"("level", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_lesson_stages_lesson_id_position_key" ON "vocabulary_lesson_stages"("lesson_id", "position");

-- CreateIndex
CREATE INDEX "vocabulary_stage_words_lesson_id_word_id_idx" ON "vocabulary_stage_words"("lesson_id", "word_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_stage_words_lesson_id_stage_id_position_key" ON "vocabulary_stage_words"("lesson_id", "stage_id", "position");

-- CreateIndex
CREATE INDEX "vocabulary_exercises_lesson_id_correct_word_id_idx" ON "vocabulary_exercises"("lesson_id", "correct_word_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_exercises_lesson_id_stage_id_position_key" ON "vocabulary_exercises"("lesson_id", "stage_id", "position");

-- CreateIndex
CREATE INDEX "vocabulary_exercise_options_lesson_id_word_id_idx" ON "vocabulary_exercise_options"("lesson_id", "word_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_exercise_options_lesson_id_exercise_id_position_key" ON "vocabulary_exercise_options"("lesson_id", "exercise_id", "position");

-- AddForeignKey
ALTER TABLE "vocabulary_lesson_translations" ADD CONSTRAINT "vocabulary_lesson_translations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "vocabulary_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_lesson_words" ADD CONSTRAINT "vocabulary_lesson_words_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "vocabulary_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_lesson_stages" ADD CONSTRAINT "vocabulary_lesson_stages_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "vocabulary_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_stage_translations" ADD CONSTRAINT "vocabulary_stage_translations_lesson_id_stage_id_fkey" FOREIGN KEY ("lesson_id", "stage_id") REFERENCES "vocabulary_lesson_stages"("lesson_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_stage_words" ADD CONSTRAINT "vocabulary_stage_words_lesson_id_stage_id_fkey" FOREIGN KEY ("lesson_id", "stage_id") REFERENCES "vocabulary_lesson_stages"("lesson_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_stage_words" ADD CONSTRAINT "vocabulary_stage_words_lesson_id_word_id_fkey" FOREIGN KEY ("lesson_id", "word_id") REFERENCES "vocabulary_lesson_words"("lesson_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_exercises" ADD CONSTRAINT "vocabulary_exercises_lesson_id_stage_id_fkey" FOREIGN KEY ("lesson_id", "stage_id") REFERENCES "vocabulary_lesson_stages"("lesson_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_exercises" ADD CONSTRAINT "vocabulary_exercises_lesson_id_correct_word_id_fkey" FOREIGN KEY ("lesson_id", "correct_word_id") REFERENCES "vocabulary_lesson_words"("lesson_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_exercise_options" ADD CONSTRAINT "vocabulary_exercise_options_lesson_id_exercise_id_fkey" FOREIGN KEY ("lesson_id", "exercise_id") REFERENCES "vocabulary_exercises"("lesson_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_exercise_options" ADD CONSTRAINT "vocabulary_exercise_options_lesson_id_word_id_fkey" FOREIGN KEY ("lesson_id", "word_id") REFERENCES "vocabulary_lesson_words"("lesson_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Prisma does not represent PostgreSQL CHECK constraints; keep these with the migration.
ALTER TABLE "vocabulary_lessons"
    ADD CONSTRAINT "vocabulary_lessons_content_check" CHECK (
        btrim("slug") <> ''
    );

ALTER TABLE "vocabulary_lesson_translations"
    ADD CONSTRAINT "vocabulary_lesson_translations_content_check" CHECK (
        btrim("locale") <> '' AND btrim("title") <> '' AND btrim("description") <> ''
    );

ALTER TABLE "vocabulary_stage_translations"
    ADD CONSTRAINT "vocabulary_stage_translations_content_check" CHECK (
        btrim("locale") <> '' AND btrim("title") <> '' AND btrim("description") <> ''
    );

ALTER TABLE "vocabulary_lesson_words"
    ADD CONSTRAINT "vocabulary_lesson_words_content_check" CHECK (
        btrim("id") <> '' AND btrim("word") <> '' AND btrim("transcription") <> ''
        AND btrim("translation_uk") <> '' AND btrim("example") <> ''
        AND btrim("example_translation_uk") <> '' AND btrim("image_key") <> ''
        AND btrim("image_source_url") <> '' AND btrim("image_license") <> ''
        AND btrim("image_attribution") <> ''
    ),
    ADD CONSTRAINT "vocabulary_lesson_words_image_key_check" CHECK (
        "image_key" NOT LIKE '/%' AND "image_key" NOT LIKE '%://%'
    );

ALTER TABLE "vocabulary_lesson_stages"
    ADD CONSTRAINT "vocabulary_lesson_stages_position_check" CHECK ("position" >= 0),
    ADD CONSTRAINT "vocabulary_lesson_stages_content_check" CHECK (btrim("id") <> '');

ALTER TABLE "vocabulary_stage_words"
    ADD CONSTRAINT "vocabulary_stage_words_position_check" CHECK ("position" >= 0);

ALTER TABLE "vocabulary_exercises"
    ADD CONSTRAINT "vocabulary_exercises_position_check" CHECK ("position" >= 0),
    ADD CONSTRAINT "vocabulary_exercises_id_check" CHECK (btrim("id") <> ''),
    ADD CONSTRAINT "vocabulary_exercises_sentence_check" CHECK (
        (
            "kind" = 'sentence_gap'
            AND "sentence_before" IS NOT NULL AND "sentence_after" IS NOT NULL
            AND "sentence_translation_uk" IS NOT NULL
            AND btrim("sentence_before" || "sentence_after") <> ''
            AND btrim("sentence_translation_uk") <> ''
        ) OR (
            "kind" <> 'sentence_gap'
            AND "sentence_before" IS NULL AND "sentence_after" IS NULL
            AND "sentence_translation_uk" IS NULL
        )
    );

ALTER TABLE "vocabulary_exercise_options"
    ADD CONSTRAINT "vocabulary_exercise_options_position_check" CHECK ("position" >= 0);

-- A lesson cascades through both words and stages. Defer these cross-branch
-- references until commit so deleting the whole lesson is independent of
-- cascade trigger order, while deleting a referenced word alone still fails.
ALTER TABLE "vocabulary_stage_words"
    ALTER CONSTRAINT "vocabulary_stage_words_lesson_id_word_id_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "vocabulary_exercises"
    ALTER CONSTRAINT "vocabulary_exercises_lesson_id_correct_word_id_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "vocabulary_exercise_options"
    ALTER CONSTRAINT "vocabulary_exercise_options_lesson_id_word_id_fkey" DEFERRABLE INITIALLY DEFERRED;
