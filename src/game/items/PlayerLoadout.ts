import { SHOT } from '../config/constants'
import { PurchaseManager } from '../utils/PurchaseManager'
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
    const ownedShots = ITEM_REGISTRY
      .filter(item => item.type === 'shot' && item.shotConfig && PurchaseManager.has(item.id))
      .sort((a, b) => b.price - a.price)

    const base = ownedShots[0]?.shotConfig ?? BASE_SHOT

    return PlayerLoadout.getActiveEffects().reduce<ShotConfig>((cfg, fx) => {
      if (fx.stat === 'shotCooldownMultiplier') return { ...cfg, cooldown: cfg.cooldown * fx.value }
      if (fx.stat === 'shotSpeedMultiplier')    return { ...cfg, speed: cfg.speed * fx.value }
      return cfg
    }, base)
  }

  static getActiveEffects(): UpgradeEffect[] {
    return ITEM_REGISTRY
      .filter(item => item.type === 'upgrade' && item.effect && PurchaseManager.has(item.id))
      .map(item => item.effect!)
  }
}
