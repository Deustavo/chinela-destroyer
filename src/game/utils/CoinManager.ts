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
}
