// Client-side HMAC+XOR provides casual tamper deterrence, not real security.
// The key is intentionally visible in the bundle — hiding it would offer no extra protection.
const SECRET = import.meta.env.VITE_STORAGE_SECRET as string

// Bump this whenever the SECRET changes. Saves from older versions are wiped on boot.
const STORAGE_VERSION = '1'
const VERSION_KEY = 'storageVersion'

export const STORAGE_KEYS = [
  'totalCoins',
  'purchases',
  'equipped',
  'newItemNotification',
  'unlockedAchievements',
  'highScore',
  'tutorialSeen',
  'shopTutorialSeen',
  'item-levels',
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
  const savedVersion = localStorage.getItem(VERSION_KEY)
  if (savedVersion !== STORAGE_VERSION) {
    // Version mismatch or missing — wipe all game data and stamp new version
    for (const key of keys) localStorage.removeItem(key)
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION)
    return
  }

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
