import { storageGet, storageSet } from './storage'

const KEY = 'item-levels'

export class UpgradeManager {
  private static getMap(): Record<string, number> {
    const raw = storageGet(KEY)
    if (!raw) return {}
    try { return JSON.parse(raw) as Record<string, number> } catch { return {} }
  }

  static getLevel(itemId: string): number {
    return this.getMap()[itemId] ?? 0
  }

  static setLevel(itemId: string, level: number): void {
    const map = this.getMap()
    map[itemId] = level
    storageSet(KEY, JSON.stringify(map))
  }

  static upgrade(itemId: string): void {
    const current = this.getLevel(itemId)
    if (current < 3) this.setLevel(itemId, current + 1)
  }
}
