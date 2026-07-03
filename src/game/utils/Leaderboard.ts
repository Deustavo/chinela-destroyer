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

/** Fetch the top `limit` scores for a mode, highest first. Returns [] on any error. */
export async function fetchTop(mode: GameMode, limit = 15): Promise<ScoreEntry[]> {
  if (!isConfigured()) return []
  try {
    const query = `select=name,score,created_at&mode=eq.${mode}&order=score.desc&limit=${limit}`
    const res = await fetch(`${URL}/rest/v1/scores?${query}`, { headers: headers() })
    if (!res.ok) return []
    const rows = (await res.json()) as ScoreEntry[]
    return Array.isArray(rows) ? rows : []
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
