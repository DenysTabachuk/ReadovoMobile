ALTER TABLE "learning_topics" ADD COLUMN "thumbnail_image_key" TEXT;

-- Switch only known sample artwork still pointing at the original PNGs.
UPDATE "learning_lessons" AS lesson
SET "thumbnail_image_key" = CASE lesson."thumbnail_image_key"
      WHEN 'learning/lessons/oktoberfest/reading/v1.png'
      THEN 'learning/lessons/oktoberfest/thumbnail/v1.webp'
      ELSE lesson."thumbnail_image_key"
    END,
    "reading_image_key" = CASE lesson."reading_image_key"
      WHEN 'learning/lessons/oktoberfest/reading/v1.png'
      THEN 'learning/lessons/oktoberfest/reading/v2.webp'
      ELSE lesson."reading_image_key"
    END,
    "results_image_key" = CASE lesson."results_image_key"
      WHEN 'learning/lessons/oktoberfest/questions/v1.png'
      THEN 'learning/lessons/oktoberfest/questions/v2.webp'
      ELSE lesson."results_image_key"
    END
FROM "learning_topics" AS topic
WHERE lesson."topic_id" = topic."id"
  AND lesson."slug" IN ('oktoberfest', 'seed-oktoberfest')
  AND topic."slug" IN ('germany', 'seed-germany')
  AND topic."cover_image_key" = 'learning/topics/germany/v1.png';

UPDATE "learning_topics"
SET "cover_image_key" = 'learning/topics/germany/v2.webp',
    "thumbnail_image_key" = 'learning/topics/germany/catalogue/v1.webp'
WHERE "slug" IN ('germany', 'seed-germany')
  AND "cover_image_key" = 'learning/topics/germany/v1.png';
