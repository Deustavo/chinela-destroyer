// Shared HMAC-signed run token used by the leaderboard Edge Functions.
//
// A token is `${payloadB64url}.${signatureB64url}` where the payload is a small
// JSON blob describing when the run started, a one-time nonce, and the mode.
// The signing secret (SCORE_SIGNING_SECRET) lives ONLY in the Edge Function
// runtime — it is never shipped to the browser — so a client cannot forge a
// token, which is what lets submit-score trust the embedded start timestamp.

export interface RunClaims {
  /** Issued-at, epoch milliseconds (server clock). */
  iat: number
  /** One-time nonce; the unique `nonce` column on `scores` blocks replay. */
  n: string
  /** Game mode the run was started for. */
  m: 'normal' | 'semFim'
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function bytesFromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/** Produce a signed token embedding the given claims. */
export async function signToken(claims: RunClaims, secret: string): Promise<string> {
  const payload = b64urlFromBytes(encoder.encode(JSON.stringify(claims)))
  const key = await importKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return `${payload}.${b64urlFromBytes(new Uint8Array(sig))}`
}

/**
 * Verify a token's signature and return its claims, or `null` when the token is
 * malformed or the signature does not match. Uses `crypto.subtle.verify`, which
 * is constant-time, so no timing side channel on the comparison.
 */
export async function verifyToken(token: string, secret: string): Promise<RunClaims | null> {
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const key = await importKey(secret)

  let ok = false
  try {
    ok = await crypto.subtle.verify('HMAC', key, bytesFromB64url(sig), encoder.encode(payload))
  } catch {
    return null
  }
  if (!ok) return null

  try {
    const claims = JSON.parse(decoder.decode(bytesFromB64url(payload))) as RunClaims
    if (typeof claims.iat !== 'number' || typeof claims.n !== 'string') return null
    if (claims.m !== 'normal' && claims.m !== 'semFim') return null
    return claims
  } catch {
    return null
  }
}

/** CORS headers — the game runs cross-origin (itch.io iframe), so preflight matters. */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
