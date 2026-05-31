import { storageGet, storageSet, parseJson } from './storage'

const KEY = 'item-levels'

export class UpgradeManager {
  private static getMap(): Record<string, number> {
    return parseJson(storageGet(KEY), {} as Record<string, number>)
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
