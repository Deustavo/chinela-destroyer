import { SHOT } from '../config/constants'
import { EquipManager } from '../utils/EquipManager'
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
  // Picks the highest-price owned shot, then folds in all upgrade multipliers.
  static getActiveShotConfig(): ShotConfig {
    const equipped = EquipManager.getEquipped()
    const equippedItem = equipped
      ? ITEM_REGISTRY.find(item => item.id === equipped && item.type === 'shot' && item.shotConfig)
      : undefined

    const base = equippedItem?.shotConfig ?? BASE_SHOT

    return PlayerLoadout.getActiveEffects().reduce<ShotConfig>((cfg, fx) => {
      if (fx.stat === 'shotCooldownMultiplier') return { ...cfg, cooldown: cfg.cooldown * fx.value }
      if (fx.stat === 'shotSpeedMultiplier')    return { ...cfg, speed: cfg.speed * fx.value }
      return cfg
    }, base)
  }

  static getActiveEffects(): UpgradeEffect[] {
    const equipped = EquipManager.getEquipped()
    if (!equipped) return []
    const item = ITEM_REGISTRY.find(i => i.id === equipped && i.type === 'upgrade' && i.effect)
    return item?.effect ? [item.effect] : []
  }
}
