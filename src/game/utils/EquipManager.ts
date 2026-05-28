import { storageGet, storageSet } from './storage'

const KEY = 'equipped'

export class EquipManager {
  static getEquipped(): string | null {
    return storageGet(KEY)
  }

  static isEquipped(itemId: string): boolean {
    return storageGet(KEY) === itemId
  }

  static equip(itemId: string): void {
    storageSet(KEY, itemId)
  }
}
