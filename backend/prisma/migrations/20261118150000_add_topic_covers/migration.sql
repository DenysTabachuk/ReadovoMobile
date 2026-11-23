ALTER TABLE "learning_topics" ADD COLUMN "cover_image_key" TEXT;
ALTER TABLE "learning_topics" ADD CONSTRAINT "learning_topic_cover_key"
CHECK (cover_image_key IS NULL OR cover_image_key ~ '^[a-z0-9][a-z0-9/_-]*\.(png|webp|jpg|svg)$');
