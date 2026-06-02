import { storageGet, storageSet } from './storage'

const KEY = 'totalCoins'

export class CoinManager {
  static getTotal(): number {
    return parseInt(storageGet(KEY) ?? '0', 10)
  }

  static add(amount: number): number {
    const next = CoinManager.getTotal() + amount
    storageSet(KEY, String(next))
    return next
  }

  static spend(amount: number): boolean {
    const total = CoinManager.getTotal()
    if (total < amount) return false
    storageSet(KEY, String(total - amount))
    return true
  }
}
