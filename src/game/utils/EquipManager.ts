const KEY = 'equipped'

export class EquipManager {
  static getEquipped(): string | null {
    return localStorage.getItem(KEY)
  }

  static isEquipped(itemId: string): boolean {
    return localStorage.getItem(KEY) === itemId
  }

  static equip(itemId: string): void {
    localStorage.setItem(KEY, itemId)
  }
}
