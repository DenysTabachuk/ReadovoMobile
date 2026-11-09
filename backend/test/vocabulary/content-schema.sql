-- Executed by content-schema.e2e-spec.ts in an isolated test database.
BEGIN;

INSERT INTO vocabulary_lessons (id, slug, level)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'common-things', 'A1'),
  ('00000000-0000-4000-8000-000000000002', 'school-things', 'A2');

-- Adding another locale adds rows, not schema columns.
INSERT INTO vocabulary_lesson_translations (lesson_id, locale, title, description)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'en', 'Common things', 'Everyday objects'),
  ('00000000-0000-4000-8000-000000000001', 'uk', 'Things in Ukrainian', 'Objects in Ukrainian'),
  ('00000000-0000-4000-8000-000000000001', 'pl', 'Things in Polish', 'Objects in Polish');

INSERT INTO vocabulary_lesson_words
  (lesson_id, id, word, transcription, translation_uk, example, example_translation_uk,
   image_key, image_source_url, image_license, image_attribution)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'backpack', 'Backpack', '/test/', 'Bag', 'My backpack is red.', 'Example translation',
   'vocabulary/backpack/v1.svg', 'https://example.com/source', 'CC BY 4.0', 'Test author'),
  ('00000000-0000-4000-8000-000000000001', 'book', 'Book', '/test/', 'Book translation', 'I read a book.', 'Example translation',
   'vocabulary/book/v1.svg', 'https://example.com/source', 'CC BY 4.0', 'Test author'),
  ('00000000-0000-4000-8000-000000000002', 'pencil', 'Pencil', '/test/', 'Pencil translation', 'I write with a pencil.', 'Example translation',
   'vocabulary/pencil/v1.svg', 'https://example.com/source', 'CC BY 4.0', 'Test author');

INSERT INTO vocabulary_lesson_stages (lesson_id, id, position, kind)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'learn-first', 0, 'learn'),
  ('00000000-0000-4000-8000-000000000001', 'final-practice', 1, 'practice');

INSERT INTO vocabulary_stage_translations (lesson_id, stage_id, locale, title, description)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'learn-first', 'en', 'Learn', 'Learn words'),
  ('00000000-0000-4000-8000-000000000001', 'learn-first', 'uk', 'Learn in Ukrainian', 'Learn words in Ukrainian');

INSERT INTO vocabulary_stage_words (lesson_id, stage_id, word_id, position)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'learn-first', 'backpack', 0),
  ('00000000-0000-4000-8000-000000000001', 'learn-first', 'book', 1),
  ('00000000-0000-4000-8000-000000000001', 'final-practice', 'backpack', 0),
  ('00000000-0000-4000-8000-000000000001', 'final-practice', 'book', 1);

INSERT INTO vocabulary_exercises
  (lesson_id, id, stage_id, position, kind, correct_word_id, sentence_before, sentence_after, sentence_translation_uk)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'picture-backpack', 'final-practice', 0, 'word_to_picture', 'backpack', NULL, NULL, NULL),
  ('00000000-0000-4000-8000-000000000001', 'audio-backpack', 'final-practice', 1, 'audio_to_picture', 'backpack', NULL, NULL, NULL),
  ('00000000-0000-4000-8000-000000000001', 'sentence-backpack', 'final-practice', 2, 'sentence_gap', 'backpack', 'I carry books in a ', '.', 'Sentence translation');

INSERT INTO vocabulary_exercise_options (lesson_id, exercise_id, word_id, position)
SELECT '00000000-0000-4000-8000-000000000001', exercise.id, option.word_id, option.position
FROM vocabulary_exercises AS exercise
CROSS JOIN (VALUES ('backpack', 0), ('book', 1)) AS option(word_id, position);

-- Check ordinary invalid writes immediately; exercise commit-time cascade below.
SET CONSTRAINTS ALL IMMEDIATE;

DO $$
DECLARE
  test_lesson_id UUID := '00000000-0000-4000-8000-000000000001';
BEGIN
  IF (SELECT count(*) FROM vocabulary_exercises) <> 3 OR
     (SELECT count(*) FROM vocabulary_exercise_options) <> 6 THEN
    RAISE EXCEPTION 'All three exercise formats must retain their options';
  END IF;

  BEGIN
    UPDATE vocabulary_lessons SET level = 'X1' WHERE id = test_lesson_id;
    RAISE EXCEPTION 'Accepted an invalid CEFR level';
  EXCEPTION WHEN invalid_text_representation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_lessons SET slug = 'common-things' WHERE slug = 'school-things';
    RAISE EXCEPTION 'Accepted duplicate lesson slugs';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  IF (SELECT count(*) FROM vocabulary_lesson_translations) <> 3 THEN
    RAISE EXCEPTION 'Did not retain all lesson locales';
  END IF;

  BEGIN
    INSERT INTO vocabulary_lesson_translations VALUES (test_lesson_id, 'en', 'Duplicate', 'Duplicate');
    RAISE EXCEPTION 'Accepted a duplicate lesson locale';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_lesson_translations SET title = ' ' WHERE locale = 'uk';
    RAISE EXCEPTION 'Accepted a blank translated title';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO vocabulary_stage_translations VALUES (test_lesson_id, 'learn-first', 'en', 'Duplicate', 'Duplicate');
    RAISE EXCEPTION 'Accepted a duplicate stage locale';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO vocabulary_stage_translations VALUES ('00000000-0000-4000-8000-000000000002', 'learn-first', 'en', 'Wrong lesson', 'Wrong lesson');
    RAISE EXCEPTION 'Accepted a stage translation under the wrong lesson';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_lesson_words SET image_key = 'https://example.com/image.svg' WHERE id = 'backpack';
    RAISE EXCEPTION 'Accepted an image URL instead of an object key';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_lesson_words SET translation_uk = ' ' WHERE id = 'backpack';
    RAISE EXCEPTION 'Accepted blank word content';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_lesson_stages SET position = -1 WHERE id = 'learn-first';
    RAISE EXCEPTION 'Accepted a negative position';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_lesson_stages SET position = 0 WHERE id = 'final-practice';
    RAISE EXCEPTION 'Accepted duplicate stage positions';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_stage_words SET word_id = 'pencil' WHERE stage_id = 'learn-first' AND word_id = 'backpack';
    RAISE EXCEPTION 'Accepted a stage word from another lesson';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_exercises SET correct_word_id = 'pencil' WHERE id = 'picture-backpack';
    RAISE EXCEPTION 'Accepted an answer word from another lesson';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_exercises SET position = 0 WHERE id = 'audio-backpack';
    RAISE EXCEPTION 'Accepted duplicate question positions';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_exercises SET sentence_before = NULL WHERE id = 'sentence-backpack';
    RAISE EXCEPTION 'Accepted an incomplete sentence gap';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_exercises SET sentence_before = 'Unexpected sentence' WHERE id = 'audio-backpack';
    RAISE EXCEPTION 'Accepted sentence fields on an audio question';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_exercise_options SET word_id = 'pencil' WHERE exercise_id = 'picture-backpack' AND word_id = 'book';
    RAISE EXCEPTION 'Accepted an option from another lesson';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    UPDATE vocabulary_exercise_options SET position = 0 WHERE exercise_id = 'picture-backpack' AND word_id = 'book';
    RAISE EXCEPTION 'Accepted duplicate option positions';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    DELETE FROM vocabulary_lesson_words WHERE id = 'backpack';
    RAISE EXCEPTION 'Deleted a word still referenced by a stage or exercise';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  SET CONSTRAINTS ALL DEFERRED;
  DELETE FROM vocabulary_lessons WHERE id = test_lesson_id;
  SET CONSTRAINTS ALL IMMEDIATE;
  IF EXISTS (SELECT 1 FROM vocabulary_lesson_words WHERE vocabulary_lesson_words.lesson_id = test_lesson_id) OR
     EXISTS (SELECT 1 FROM vocabulary_lesson_translations) OR
     EXISTS (SELECT 1 FROM vocabulary_stage_translations) OR
     EXISTS (SELECT 1 FROM vocabulary_lesson_stages) OR
     EXISTS (SELECT 1 FROM vocabulary_stage_words) OR
     EXISTS (SELECT 1 FROM vocabulary_exercises) OR
     EXISTS (SELECT 1 FROM vocabulary_exercise_options) THEN
    RAISE EXCEPTION 'Deleting a lesson did not cascade through its content';
  END IF;
  IF (SELECT count(*) FROM vocabulary_lesson_words) <> 1 THEN
    RAISE EXCEPTION 'Deleting one lesson changed another lesson';
  END IF;
END $$;

ROLLBACK;
