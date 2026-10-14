CREATE TYPE dictionary_word_progress AS ENUM ('new', 'in_progress', 'learned');

ALTER TABLE dictionary_words
  ALTER COLUMN progress DROP DEFAULT,
  ALTER COLUMN progress TYPE dictionary_word_progress
    USING progress::dictionary_word_progress,
  ALTER COLUMN progress SET DEFAULT 'new';

CREATE TYPE streak_day_status AS ENUM ('completed', 'missed', 'frozen', 'restored');

ALTER TABLE user_streak_history
  ALTER COLUMN status TYPE streak_day_status
    USING status::streak_day_status;
