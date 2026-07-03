-- Move score submission behind the submit-score Edge Function.
--
-- Run this AFTER the initial schema from LEADERBOARD_SETUP.md. It:
--   * drops the anon INSERT policy (clients can no longer POST scores directly),
--   * adds a one-time `nonce` column with a UNIQUE constraint so a replayed run
--     token cannot insert the same score twice.
-- The submit-score function inserts with the service_role key, which bypasses
-- RLS, so it keeps working. anon can still SELECT (read the ranking).

-- Clients must go through the Edge Function now.
drop policy if exists "public insert valid scores" on public.scores;

-- One-time nonce carried by each run token; blocks replay.
alter table public.scores
  add column if not exists nonce text;

create unique index if not exists scores_nonce_key
  on public.scores (nonce);
