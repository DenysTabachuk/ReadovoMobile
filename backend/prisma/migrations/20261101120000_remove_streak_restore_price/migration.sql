-- Restore prices belong to server policy, not persisted break details.
UPDATE "user_streak_profiles"
SET "broken_streak_info" = "broken_streak_info" - 'restorePrice'
WHERE jsonb_typeof("broken_streak_info") = 'object'
  AND "broken_streak_info" ? 'restorePrice';
