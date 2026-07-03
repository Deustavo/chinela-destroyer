// Edge Function: submit-score
//
// The ONLY way a score reaches the `scores` table. The anon role has no insert
// policy, so a client can no longer POST arbitrary rows to /rest/v1/scores —
// it must go through here. This function:
//   1. Verifies the run token's HMAC signature (secret never leaves the server).
//   2. Rejects scores too high for the time elapsed since the token was issued
//      (a fresh token cannot justify a huge score).
//   3. Rejects stale tokens and out-of-range name/score/mode values.
//   4. Inserts with the token's nonce; a UNIQUE constraint blocks replay.
// The insert uses the service_role key (auto-injected by Supabase), which
// bypasses RLS.
//
// Deploy:  supabase functions deploy submit-score
// Secret:  supabase secrets set SCORE_SIGNING_SECRET=<same secret as start-run>

import { corsHeaders, verifyToken } from '../_shared/token.ts'

// Score is climbed height (`-scrollY / 10`). A perfect single jump gains ~42
// units/s; this ceiling is ~3x that, so legit players never trip it while an
// "instant 1,000,000" is impossible for a fresh token to justify.
const MAX_UNITS_PER_SEC = 120
// Grace for network + scene startup before the first height is counted.
const START_GRACE_MS = 3000
// Tokens older than this are refused (also an upper bound on run length).
const MAX_AGE_MS = 12 * 60 * 60 * 1000
// Absolute sanity cap regardless of timing.
const MAX_SCORE = 5_000_000

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const secret = Deno.env.get('SCORE_SIGNING_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!secret || !supabaseUrl || !serviceKey) return json({ error: 'not configured' }, 500)

  let body: { name?: unknown; score?: unknown; mode?: unknown; token?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad request' }, 400)
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 20) : ''
  const score = typeof body.score === 'number' ? Math.floor(body.score) : NaN
  const mode = body.mode === 'semFim' ? 'semFim' : body.mode === 'normal' ? 'normal' : null
  const token = typeof body.token === 'string' ? body.token : ''

  // Basic value validation (mirrors the old RLS `with check`).
  if (name.length < 1 || name.length > 20) return json({ error: 'invalid name' }, 422)
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return json({ error: 'invalid score' }, 422)
  if (!mode) return json({ error: 'invalid mode' }, 422)

  // Token verification.
  const claims = await verifyToken(token, secret)
  if (!claims) return json({ error: 'invalid token' }, 401)
  if (claims.m !== mode) return json({ error: 'mode mismatch' }, 422)

  const elapsed = Date.now() - claims.iat
  if (elapsed < 0 || elapsed > MAX_AGE_MS) return json({ error: 'stale token' }, 422)

  // Plausibility: the run must have lasted at least as long as the score requires.
  const minMs = (score / MAX_UNITS_PER_SEC) * 1000
  if (elapsed + START_GRACE_MS < minMs) return json({ error: 'implausible score' }, 422)

  // Insert via service role (bypasses RLS). The nonce's UNIQUE constraint turns
  // a replayed token into a duplicate-key error (Postgres code 23505).
  const res = await fetch(`${supabaseUrl}/rest/v1/scores`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ name, score, mode, nonce: claims.n }),
  })

  if (res.status === 409) return json({ error: 'already submitted' }, 409)
  if (!res.ok) return json({ error: 'insert failed' }, 502)

  return json({ ok: true })
})
