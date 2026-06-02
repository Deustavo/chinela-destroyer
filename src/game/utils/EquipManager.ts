import { storageGet, storageSet, parseJson } from './storage'
import { ITEM_REGISTRY } from '../items/registry'

const KEY = 'equipped'

// The player may equip up to 2 items at once, with at most one 'shot' item
// (only a single projectile can be active). 'nada' is not a real slot — it
// represents the empty loadout.
export const MAX_EQUIP_SLOTS = 2

export class EquipManager {
  // Returns the equipped item ids (0..MAX_EQUIP_SLOTS), never including 'nada'.
  static getEquipped(): string[] {
    const raw = storageGet(KEY)
    if (!raw) return []
    // New format: JSON array. Legacy format: a single bare item id.
    if (raw.startsWith('[')) {
      return parseJson<string[]>(raw, []).filter(id => id && id !== 'nada')
    }
    return raw === 'nada' ? [] : [raw]
  }

  static isEquipped(itemId: string): boolean {
    const list = this.getEquipped()
    // 'nada' (the empty loadout) is "equipped" only when nothing else is.
    if (itemId === 'nada') return list.length === 0
    return list.includes(itemId)
  }

  // Equip an item, enforcing the loadout rules (max 2 slots, max 1 shot).
  // Equipping 'nada' clears the whole loadout. Re-equipping an already-equipped
  // item is a no-op (use unequip / toggle to remove it).
  static equip(itemId: string): void {
    if (itemId === 'nada') { this.save([]); return }

    let list = this.getEquipped().filter(id => id !== itemId)

    if (this.isShot(itemId)) {
      // Only one shot may be active — drop any other equipped shot.
      list = list.filter(id => !this.isShot(id))
    }

    list.push(itemId)
    while (list.length > MAX_EQUIP_SLOTS) list.shift() // drop the oldest

    this.save(list)
  }

  static unequip(itemId: string): void {
    this.save(this.getEquipped().filter(id => id !== itemId))
  }

  // Toggle an item on/off. 'nada' always clears the loadout.
  static toggle(itemId: string): void {
    if (itemId === 'nada') { this.save([]); return }
    if (this.isEquipped(itemId)) this.unequip(itemId)
    else this.equip(itemId)
  }

  private static isShot(itemId: string): boolean {
    return ITEM_REGISTRY.find(i => i.id === itemId)?.type === 'shot'
  }

  private static save(list: string[]): void {
    storageSet(KEY, JSON.stringify(list))
  }
}
