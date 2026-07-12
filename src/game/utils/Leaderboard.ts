// Online leaderboard backed by Supabase (PostgREST).
//
// Talks to the Supabase REST API directly with `fetch` — no SDK dependency, so
// the bundle stays small. The anon key is a *public* key meant to ship in the
// client; row-level security on the `scores` table is what actually restricts
// what the anon role may do (insert valid rows + read). See LEADERBOARD_SETUP.md.

export type GameMode = 'normal' | 'semFim'

export interface ScoreEntry {
  name: string
  score: number
  created_at?: string
}

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

/** True when both env vars are present, i.e. the online ranking can be reached. */
export function isConfigured(): boolean {
  return URL.length > 0 && ANON.length > 0
}

function headers(): Record<string, string> {
  return {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    'Content-Type': 'application/json',
  }
}

/** Collapse duplicate names, keeping only the highest score per name.
 *  Assumes `rows` is already ordered by score descending, so the first
 *  occurrence of each name is its best score. Comparison is case-insensitive
 *  and trims surrounding whitespace. */
function dedupeByName(rows: ScoreEntry[]): ScoreEntry[] {
  const seen = new Set<string>()
  const result: ScoreEntry[] = []
  for (const row of rows) {
    const key = row.name.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(row)
  }
  return result
}

/** Fetch the top `limit` scores for a mode, highest first. Returns [] on any error.
 *  In `normal` mode duplicate names are collapsed to their highest score only. */
export async function fetchTop(mode: GameMode, limit = 15): Promise<ScoreEntry[]> {
  if (!isConfigured()) return []
  // In normal mode we collapse duplicate names, so over-fetch to still fill `limit`
  // unique rows even when the same player appears many times near the top.
  const fetchLimit = mode === 'normal' ? Math.min(limit * 10, 1000) : limit
  try {
    const query = `select=name,score,created_at&mode=eq.${mode}&order=score.desc&limit=${fetchLimit}`
    const res = await fetch(`${URL}/rest/v1/scores?${query}`, { headers: headers() })
    if (!res.ok) return []
    const rows = (await res.json()) as ScoreEntry[]
    if (!Array.isArray(rows)) return []
    return mode === 'normal' ? dedupeByName(rows).slice(0, limit) : rows
  } catch {
    return []
  }
}

/** True when `score` would place within the top 50 entries for `mode` (or the
 *  board has fewer than 50 entries yet). Used to gate the save-ranking modal so
 *  it isn't shown for runs that wouldn't make the cut. Returns true when the
 *  ranking is unreachable, so offline play never blocks the modal. */
export async function qualifiesForTop50(score: number, mode: GameMode): Promise<boolean> {
  if (!isConfigured()) return true
  const top50 = await fetchTop(mode, 50)
  if (top50.length < 50) return true
  const lowest = top50[top50.length - 1].score
  return score > lowest
}

// A score can no longer be inserted directly: the anon role has no insert
// policy on `scores`. Instead the client asks `start-run` for a signed token
// when a run begins, holds it, and hands it to `submit-score` at the end. The
// server uses the token's start timestamp to reject implausible scores. See
// supabase/functions/ and LEADERBOARD_SETUP.md.

/** The token for the current run, set by startRun() and consumed by submitScore(). */
let currentToken: string | null = null
let currentTokenMode: GameMode | null = null

/**
 * Begin a run: fetch a signed token from the `start-run` Edge Function and hold
 * it for the later submitScore() call. Safe to call unconditionally — it no-ops
 * when the ranking is unconfigured, and any failure just leaves the run
 * unsubmittable (same graceful degradation as before).
 */
export async function startRun(mode: GameMode): Promise<void> {
  currentToken = null
  currentTokenMode = null
  if (!isConfigured()) return
  try {
    const res = await fetch(`${URL}/functions/v1/start-run`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ mode }),
    })
    if (!res.ok) return
    const data = (await res.json()) as { token?: string }
    if (typeof data.token === 'string') {
      currentToken = data.token
      currentTokenMode = mode
    }
  } catch {
    // Offline / unreachable → no token; submitScore will simply return false.
  }
}

/**
 * Submit a score through the `submit-score` Edge Function using the token from
 * startRun(). Returns true on success. Silently fails (returns false) when
 * offline/unconfigured, when no valid token was obtained for this mode, or when
 * the server rejects the score. The token is single-use and cleared afterwards.
 */
export async function submitScore(name: string, score: number, mode: GameMode): Promise<boolean> {
  if (!isConfigured()) return false
  const clean = name.trim().slice(0, 20)
  if (clean.length === 0 || score < 0) return false
  if (!currentToken || currentTokenMode !== mode) return false

  const token = currentToken
  currentToken = null // single use, regardless of outcome
  currentTokenMode = null
  try {
    const res = await fetch(`${URL}/functions/v1/submit-score`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name: clean, score: Math.floor(score), mode, token }),
    })
    return res.ok
  } catch {
    return false
  }
}
