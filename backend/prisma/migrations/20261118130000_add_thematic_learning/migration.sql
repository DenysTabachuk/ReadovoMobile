-- CreateTable
CREATE TABLE "learning_topics" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "position" INTEGER NOT NULL,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "learning_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_topic_translations" (
    "topic_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "learning_topic_translations_pkey" PRIMARY KEY ("topic_id","locale")
);

-- CreateTable
CREATE TABLE "learning_lessons" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "topic_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "learning_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_lesson_translations" (
    "lesson_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "learning_lesson_translations_pkey" PRIMARY KEY ("lesson_id","locale")
);

-- CreateTable
CREATE TABLE "learning_lesson_variants" (
    "lesson_id" UUID NOT NULL,
    "level" "vocabulary_level" NOT NULL,
    "vocabulary_lesson_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "reading_title" TEXT NOT NULL,
    "reading_paragraphs" TEXT[],

    CONSTRAINT "learning_lesson_variants_pkey" PRIMARY KEY ("lesson_id","level")
);

-- CreateTable
CREATE TABLE "learning_reading_questions" (
    "lesson_id" UUID NOT NULL,
    "level" "vocabulary_level" NOT NULL,
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "learning_reading_questions_pkey" PRIMARY KEY ("lesson_id","level","id")
);

-- CreateTable
CREATE TABLE "learning_reading_options" (
    "lesson_id" UUID NOT NULL,
    "level" "vocabulary_level" NOT NULL,
    "question_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "learning_reading_options_pkey" PRIMARY KEY ("lesson_id","level","question_id","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_topics_slug_key" ON "learning_topics"("slug");

-- CreateIndex
CREATE INDEX "learning_topics_parent_id_position_idx" ON "learning_topics"("parent_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lessons_slug_key" ON "learning_lessons"("slug");

-- CreateIndex
CREATE INDEX "learning_lessons_topic_id_position_idx" ON "learning_lessons"("topic_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lesson_variants_vocabulary_lesson_id_key" ON "learning_lesson_variants"("vocabulary_lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lesson_variants_vocabulary_lesson_id_level_key" ON "learning_lesson_variants"("vocabulary_lesson_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "learning_reading_questions_lesson_id_level_position_key" ON "learning_reading_questions"("lesson_id", "level", "position");

-- CreateIndex
CREATE UNIQUE INDEX "learning_reading_options_lesson_id_level_question_id_positi_key" ON "learning_reading_options"("lesson_id", "level", "question_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_lessons_id_level_key" ON "vocabulary_lessons"("id", "level");

-- AddForeignKey
ALTER TABLE "learning_topics" ADD CONSTRAINT "learning_topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "learning_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_topic_translations" ADD CONSTRAINT "learning_topic_translations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lessons" ADD CONSTRAINT "learning_lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "learning_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lesson_translations" ADD CONSTRAINT "learning_lesson_translations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lesson_variants" ADD CONSTRAINT "learning_lesson_variants_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lesson_variants" ADD CONSTRAINT "learning_lesson_variants_vocabulary_lesson_id_level_fkey" FOREIGN KEY ("vocabulary_lesson_id", "level") REFERENCES "vocabulary_lessons"("id", "level") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_reading_questions" ADD CONSTRAINT "learning_reading_questions_lesson_id_level_fkey" FOREIGN KEY ("lesson_id", "level") REFERENCES "learning_lesson_variants"("lesson_id", "level") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_reading_options" ADD CONSTRAINT "learning_reading_options_lesson_id_level_question_id_fkey" FOREIGN KEY ("lesson_id", "level", "question_id") REFERENCES "learning_reading_questions"("lesson_id", "level", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Published content is also validated by its importer and runtime service.
ALTER TABLE learning_topics ADD CONSTRAINT learning_topic_position CHECK (position >= 0), ADD CONSTRAINT learning_topic_not_self CHECK (parent_id IS DISTINCT FROM id);
ALTER TABLE learning_lessons ADD CONSTRAINT learning_lesson_position CHECK (position >= 0);
ALTER TABLE learning_lesson_variants ADD CONSTRAINT learning_reading_title CHECK (length(btrim(reading_title)) > 0), ADD CONSTRAINT learning_reading_paragraphs CHECK (cardinality(reading_paragraphs) > 0);
ALTER TABLE learning_reading_questions ADD CONSTRAINT learning_question_position CHECK (position >= 0), ADD CONSTRAINT learning_question_copy CHECK (length(btrim(prompt)) > 0 AND length(btrim(explanation)) > 0);
ALTER TABLE learning_reading_options ADD CONSTRAINT learning_option_position CHECK (position >= 0), ADD CONSTRAINT learning_option_text CHECK (length(btrim(text)) > 0);
CREATE UNIQUE INDEX learning_reading_one_correct_option ON learning_reading_options (lesson_id, level, question_id) WHERE is_correct;

-- Serialize tree edits, then reject a parent path that reaches the edited topic.
CREATE FUNCTION guard_learning_topic_tree() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('learning-topic-tree', 0));
  IF EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id FROM learning_topics WHERE id = NEW.parent_id
      UNION
      SELECT topic.id, topic.parent_id FROM learning_topics topic JOIN ancestors ON topic.id = ancestors.parent_id
    ) SELECT 1 FROM ancestors WHERE id = NEW.id
  ) THEN RAISE EXCEPTION 'Learning topic hierarchy cannot contain a cycle'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER learning_topic_tree BEFORE INSERT OR UPDATE OF parent_id ON learning_topics FOR EACH ROW EXECUTE FUNCTION guard_learning_topic_tree();
