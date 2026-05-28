import { storageGet, storageSet } from './storage'

const KEY = 'purchases'

export class PurchaseManager {
  static has(itemId: string): boolean {
    const raw = storageGet(KEY)
    if (!raw) return false
    try { return (JSON.parse(raw) as string[]).includes(itemId) } catch { return false }
  }

  static buy(itemId: string): void {
    const raw = storageGet(KEY)
    let items: string[] = []
    try { items = raw ? (JSON.parse(raw) as string[]) : [] } catch { items = [] }
    if (!items.includes(itemId)) items.push(itemId)
    storageSet(KEY, JSON.stringify(items))
  }
}
