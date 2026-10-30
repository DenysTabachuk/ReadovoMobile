CREATE TABLE "quiz_sessions" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('article', 'vocabulary', 'dictionary')),
  "level" TEXT,
  "target_length" TEXT,
  "questions" JSONB NOT NULL,
  "completion" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  CONSTRAINT "quiz_sessions_completion_check" CHECK (("completed_at" IS NULL) = ("completion" IS NULL))
);
CREATE INDEX "quiz_sessions_user_created_idx" ON "quiz_sessions" ("user_id", "created_at");

CREATE TABLE "quiz_answers" (
  "session_id" UUID NOT NULL REFERENCES "quiz_sessions"("id") ON DELETE CASCADE,
  "question_id" TEXT NOT NULL,
  "selected_option_ids" TEXT[] NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "unlocked_achievement_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  PRIMARY KEY ("session_id", "question_id")
);
