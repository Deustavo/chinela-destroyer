// Edge Function: start-run
//
// Called by the client when a run begins. Returns a signed token that embeds
// the server-side start timestamp and a one-time nonce. The client holds the
// token and later hands it back to `submit-score`, which uses the embedded
// timestamp to reject scores that are too high for the elapsed time.
//
// Deploy:  supabase functions deploy start-run
// Secret:  supabase secrets set SCORE_SIGNING_SECRET=<a long random string>

import { corsHeaders, signToken } from '../_shared/token.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const secret = Deno.env.get('SCORE_SIGNING_SECRET')
  if (!secret) {
    return new Response(JSON.stringify({ error: 'not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let mode: 'normal' | 'semFim' = 'normal'
  try {
    const body = await req.json()
    if (body?.mode === 'semFim') mode = 'semFim'
  } catch {
    // No/invalid body → default to 'normal'.
  }

  const token = await signToken({ iat: Date.now(), n: crypto.randomUUID(), m: mode }, secret)

  return new Response(JSON.stringify({ token }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
