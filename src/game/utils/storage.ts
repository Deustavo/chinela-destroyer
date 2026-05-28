const SECRET = 'ch1n3l4-d3str0y3r-k3y-2025'

export const STORAGE_KEYS = [
  'totalCoins',
  'purchases',
  'equipped',
  'newItemNotification',
  'unlockedAchievements',
  'highScore',
] as const

let cryptoKey: CryptoKey | null = null
const cache = new Map<string, string>()

async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey
  cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  return cryptoKey
}

function xorCipher(input: string): string {
  return input
    .split('')
    .map((ch, i) => String.fromCharCode(ch.charCodeAt(0) ^ SECRET.charCodeAt(i % SECRET.length)))
    .join('')
}

async function encode(value: string): Promise<string> {
  const key = await getCryptoKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  const hmac = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return btoa(xorCipher(value)) + '.' + hmac
}

async function decode(stored: string): Promise<string | null> {
  const dot = stored.lastIndexOf('.')
  if (dot === -1) {
    // Legacy value without HMAC — accept once, will be re-written with HMAC
    try { return xorCipher(atob(stored)) } catch { return stored }
  }
  let value: string
  try { value = xorCipher(atob(stored.slice(0, dot))) } catch { return null }

  const key = await getCryptoKey()
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  const expectedHmac = btoa(String.fromCharCode(...new Uint8Array(expected)))
  // Tampered: HMAC mismatch → discard value
  if (stored.slice(dot + 1) !== expectedHmac) return null
  return value
}

/** Call once during app boot (PreloadScene). Populates the in-memory cache. */
export async function storageInit(keys: readonly string[]): Promise<void> {
  for (const key of keys) {
    const raw = localStorage.getItem(key)
    if (raw === null) continue
    const value = await decode(raw)
    if (value !== null) {
      cache.set(key, value)
      if (!raw.includes('.')) {
        // Migrate legacy entry to HMAC-signed format
        encode(value).then(encoded => localStorage.setItem(key, encoded))
      }
    }
  }
}

export function storageGet(key: string): string | null {
  return cache.get(key) ?? null
}

export function storageSet(key: string, value: string): void {
  cache.set(key, value)
  encode(value).then(encoded => localStorage.setItem(key, encoded))
}

export function storageRemove(key: string): void {
  cache.delete(key)
  localStorage.removeItem(key)
}
