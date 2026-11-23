ALTER TABLE "learning_lessons"
  ADD COLUMN "thumbnail_image_key" TEXT,
  ADD COLUMN "reading_image_key" TEXT,
  ADD COLUMN "results_image_key" TEXT;

-- Preserve the artwork of the existing local Oktoberfest sample, including its
-- earlier slug, without creating or publishing content.
UPDATE "learning_lessons" AS lesson
SET "thumbnail_image_key" = 'learning/lessons/oktoberfest/reading/v1.png',
    "reading_image_key" = 'learning/lessons/oktoberfest/reading/v1.png',
    "results_image_key" = 'learning/lessons/oktoberfest/questions/v1.png'
FROM "learning_topics" AS topic
WHERE lesson."topic_id" = topic."id"
  AND lesson."slug" IN ('oktoberfest', 'seed-oktoberfest')
  AND topic."slug" IN ('germany', 'seed-germany')
  AND topic."cover_image_key" = 'learning/topics/germany/v1.png';
