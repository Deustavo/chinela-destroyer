const KEY = 'purchases'

export class PurchaseManager {
  static has(itemId: string): boolean {
    const raw = localStorage.getItem(KEY)
    if (!raw) return false
    try { return (JSON.parse(raw) as string[]).includes(itemId) } catch { return false }
  }

  static buy(itemId: string): void {
    const raw = localStorage.getItem(KEY)
    const items: string[] = raw ? (JSON.parse(raw) as string[]) : []
    if (!items.includes(itemId)) items.push(itemId)
    localStorage.setItem(KEY, JSON.stringify(items))
  }
}
