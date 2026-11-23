BEGIN;

LOCK TABLE "vocabulary_lessons", "learning_lesson_variants" IN ACCESS EXCLUSIVE MODE;

-- The old component UUID becomes the variant UUID, preserving all child keys.
-- Stop before altering data if this database still contains standalone lessons.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "vocabulary_lessons" AS vocabulary
        WHERE NOT EXISTS (
            SELECT 1 FROM "learning_lesson_variants" AS variant
            WHERE variant."vocabulary_lesson_id" = vocabulary."id"
        )
    ) THEN
        RAISE EXCEPTION 'Standalone vocabulary records must be migrated before attaching vocabulary to learning variants';
    END IF;
END $$;

-- Keep the former effective visibility, which required both records to be published.
UPDATE "learning_lesson_variants" AS variant
SET "published_at" = NULL
FROM "vocabulary_lessons" AS vocabulary
WHERE variant."vocabulary_lesson_id" = vocabulary."id"
  AND vocabulary."published_at" IS NULL
  AND variant."published_at" IS NOT NULL;

ALTER TABLE "learning_lesson_variants" DROP CONSTRAINT "learning_lesson_variants_vocabulary_lesson_id_level_fkey";
DROP INDEX "learning_lesson_variants_vocabulary_lesson_id_level_key";
ALTER TABLE "learning_lesson_variants" RENAME COLUMN "vocabulary_lesson_id" TO "id";
ALTER INDEX "learning_lesson_variants_vocabulary_lesson_id_key" RENAME TO "learning_lesson_variants_id_key";

ALTER TABLE "vocabulary_lesson_words" DROP CONSTRAINT "vocabulary_lesson_words_lesson_id_fkey";
ALTER TABLE "vocabulary_lesson_stages" DROP CONSTRAINT "vocabulary_lesson_stages_lesson_id_fkey";
ALTER TABLE "vocabulary_lesson_words" RENAME COLUMN "lesson_id" TO "variant_id";
ALTER TABLE "vocabulary_lesson_stages" RENAME COLUMN "lesson_id" TO "variant_id";
ALTER TABLE "vocabulary_stage_translations" RENAME COLUMN "lesson_id" TO "variant_id";
ALTER TABLE "vocabulary_stage_words" RENAME COLUMN "lesson_id" TO "variant_id";
ALTER TABLE "vocabulary_exercises" RENAME COLUMN "lesson_id" TO "variant_id";
ALTER TABLE "vocabulary_exercise_options" RENAME COLUMN "lesson_id" TO "variant_id";

ALTER TABLE "vocabulary_lesson_words" ADD CONSTRAINT "vocabulary_lesson_words_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "learning_lesson_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vocabulary_lesson_stages" ADD CONSTRAINT "vocabulary_lesson_stages_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "learning_lesson_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vocabulary_stage_translations" RENAME CONSTRAINT "vocabulary_stage_translations_lesson_id_stage_id_fkey" TO "vocabulary_stage_translations_variant_id_stage_id_fkey";
ALTER TABLE "vocabulary_stage_words" RENAME CONSTRAINT "vocabulary_stage_words_lesson_id_stage_id_fkey" TO "vocabulary_stage_words_variant_id_stage_id_fkey";
ALTER TABLE "vocabulary_stage_words" RENAME CONSTRAINT "vocabulary_stage_words_lesson_id_word_id_fkey" TO "vocabulary_stage_words_variant_id_word_id_fkey";
ALTER TABLE "vocabulary_exercises" RENAME CONSTRAINT "vocabulary_exercises_lesson_id_stage_id_fkey" TO "vocabulary_exercises_variant_id_stage_id_fkey";
ALTER TABLE "vocabulary_exercises" RENAME CONSTRAINT "vocabulary_exercises_lesson_id_correct_word_id_fkey" TO "vocabulary_exercises_variant_id_correct_word_id_fkey";
ALTER TABLE "vocabulary_exercise_options" RENAME CONSTRAINT "vocabulary_exercise_options_lesson_id_exercise_id_fkey" TO "vocabulary_exercise_options_variant_id_exercise_id_fkey";
ALTER TABLE "vocabulary_exercise_options" RENAME CONSTRAINT "vocabulary_exercise_options_lesson_id_word_id_fkey" TO "vocabulary_exercise_options_variant_id_word_id_fkey";
ALTER INDEX "vocabulary_lesson_stages_lesson_id_position_key" RENAME TO "vocabulary_lesson_stages_variant_id_position_key";
ALTER INDEX "vocabulary_stage_words_lesson_id_word_id_idx" RENAME TO "vocabulary_stage_words_variant_id_word_id_idx";
ALTER INDEX "vocabulary_stage_words_lesson_id_stage_id_position_key" RENAME TO "vocabulary_stage_words_variant_id_stage_id_position_key";
ALTER INDEX "vocabulary_exercises_lesson_id_correct_word_id_idx" RENAME TO "vocabulary_exercises_variant_id_correct_word_id_idx";
ALTER INDEX "vocabulary_exercises_lesson_id_stage_id_position_key" RENAME TO "vocabulary_exercises_variant_id_stage_id_position_key";
ALTER INDEX "vocabulary_exercise_options_lesson_id_word_id_idx" RENAME TO "vocabulary_exercise_options_variant_id_word_id_idx";
ALTER INDEX "vocabulary_exercise_options_lesson_id_exercise_id_position_key" RENAME TO "vocabulary_exercise_options_variant_id_exercise_id_position_key";

DROP TABLE "vocabulary_lesson_translations";
DROP TABLE "vocabulary_lessons";

COMMIT;
