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

/** Submit a score. Returns true on success. Silently fails (returns false) when offline/unconfigured. */
export async function submitScore(name: string, score: number, mode: GameMode): Promise<boolean> {
  if (!isConfigured()) return false
  const clean = name.trim().slice(0, 20)
  if (clean.length === 0 || score < 0) return false
  try {
    const res = await fetch(`${URL}/rest/v1/scores`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'return=minimal' },
      body: JSON.stringify({ name: clean, score: Math.floor(score), mode }),
    })
    return res.ok
  } catch {
    return false
  }
}
