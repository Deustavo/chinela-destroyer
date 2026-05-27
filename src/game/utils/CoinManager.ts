const KEY = 'totalCoins'

export class CoinManager {
  static getTotal(): number {
    return parseInt(localStorage.getItem(KEY) ?? '0', 10)
  }

  static add(amount: number): number {
    const next = CoinManager.getTotal() + amount
    localStorage.setItem(KEY, String(next))
    return next
  }

  static spend(amount: number): boolean {
    const total = CoinManager.getTotal()
    if (total < amount) return false
    localStorage.setItem(KEY, String(total - amount))
    return true
  }
}
