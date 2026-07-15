-- Move top-50 selection (incl. per-name dedup for 'normal' mode) into the
-- database, so both the client's ranking list and the `submit-score` Edge
-- Function's "does this qualify for the top 50?" check share one definition
-- instead of the client re-implementing it after over-fetching rows.
--
-- For 'normal' mode, rows are collapsed to each player's best score (matched
-- on trimmed, case-insensitive name). For 'semFim' every row counts on its
-- own (partitioning by the row's own id is a no-op collapse).

create or replace function public.top_scores(p_mode text, p_limit integer default 50)
returns table(name text, score integer, created_at timestamptz)
language sql
stable
as $$
  with ranked as (
    select
      s.name,
      s.score,
      s.created_at,
      row_number() over (
        partition by case when p_mode = 'normal' then lower(trim(s.name)) else s.id::text end
        order by s.score desc
      ) as rn
    from public.scores s
    where s.mode = p_mode
  )
  select name, score, created_at
  from ranked
  where rn = 1
  order by score desc
  limit p_limit
$$;

-- Client (anon) reads the ranking exclusively through this function now.
grant execute on function public.top_scores(text, integer) to anon;
