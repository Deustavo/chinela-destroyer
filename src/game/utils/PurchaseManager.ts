import { storageGet, storageSet, parseJson } from './storage'

const KEY = 'purchases'

export class PurchaseManager {
  static has(itemId: string): boolean {
    return parseJson<string[]>(storageGet(KEY), []).includes(itemId)
  }

  static buy(itemId: string): void {
    const items = parseJson<string[]>(storageGet(KEY), [])
    if (!items.includes(itemId)) items.push(itemId)
    storageSet(KEY, JSON.stringify(items))
  }
}
