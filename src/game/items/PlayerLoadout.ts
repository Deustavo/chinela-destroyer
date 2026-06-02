import { SHOT } from '../config/constants'
import { EquipManager } from '../utils/EquipManager'
import { UpgradeManager } from '../utils/UpgradeManager'
import { ITEM_REGISTRY } from './registry'
import type { ShotConfig, UpgradeEffect } from './types'

// The base (non-purchasable) shot that every player starts with.
const BASE_SHOT: ShotConfig = {
  spriteKey: SHOT.spriteKey,
  flyAnimKey: 'shot-fly',
  impactAnimKey: 'shot-impact',
  spritesheet: { ...SHOT.spritesheet },
  flyFrames: SHOT.flyFrames,
  impactFrames: SHOT.impactFrames,
  flyFrameRate: SHOT.flyFrameRate,
  impactFrameRate: SHOT.impactFrameRate,
  speed: SHOT.speed,
  displaySize: SHOT.displaySize,
  cooldown: SHOT.cooldown,
}

export class PlayerLoadout {
  // Returns the resolved shot config to use this session.
  // Picks the equipped shot item, applies level overrides, then folds in upgrade multipliers.
  static getActiveShotConfig(): ShotConfig {
    const equipped = EquipManager.getEquipped()
    const equippedItem = ITEM_REGISTRY.find(
      item => equipped.includes(item.id) && item.type === 'shot' && item.shotConfig,
    )

    const base = equippedItem?.shotConfig ?? BASE_SHOT

    let leveledBase = base
    if (equippedItem?.levelStats) {
      const rawLevel = UpgradeManager.getLevel(equippedItem.id)
      const level = rawLevel > 0 ? rawLevel : 1  // treat 0 as 1 for migrated saves
      const ls = equippedItem.levelStats[level - 1]
      leveledBase = { ...base }
      if (ls.cooldown    !== undefined) leveledBase = { ...leveledBase, cooldown:     ls.cooldown }
      if (ls.displaySize !== undefined) leveledBase = { ...leveledBase, displaySize: ls.displaySize }
    }

    return PlayerLoadout.getActiveEffects().reduce<ShotConfig>((cfg, fx) => {
      if (fx.stat === 'shotCooldownMultiplier') return { ...cfg, cooldown: cfg.cooldown * fx.value }
      if (fx.stat === 'shotSpeedMultiplier')    return { ...cfg, speed: cfg.speed * fx.value }
      return cfg
    }, leveledBase)
  }

  static getActiveEffects(): UpgradeEffect[] {
    const equipped = EquipManager.getEquipped()
    if (equipped.length === 0) return []
    return ITEM_REGISTRY
      .filter(i => equipped.includes(i.id) && i.type === 'upgrade' && i.effect)
      .map(i => i.effect!)
  }
}
