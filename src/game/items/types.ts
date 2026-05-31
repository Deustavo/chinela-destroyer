export interface ShotConfig {
  spriteKey: string
  flyAnimKey: string
  impactAnimKey: string
  spritesheet: { path: string; frameWidth: number; frameHeight: number }
  flyFrames: readonly number[]
  impactFrames: readonly number[]
  flyFrameRate: number
  impactFrameRate: number
  speed: number
  displaySize: number
  cooldown: number
  stunDuration?: number
  soundKey?: string
}

// Multiplier-based stat modifiers that stack with upgrades.
// value is a multiplier: 0.8 = 20% reduction, 1.2 = 20% increase.
export interface UpgradeEffect {
  stat: 'shotCooldownMultiplier' | 'shotSpeedMultiplier' | 'moveSpeedMultiplier' | 'jumpMultiplier'
  value: number
}

export interface LevelStats {
  /** Coins required to reach this level (0 for level 1 / base). */
  upgradeCost: number
  /** Short description shown in the inventory upgrade panel. */
  description: string
  /** Effective cooldown at this level (shot cooldown, shield recharge, wing recharge). */
  cooldown?: number
  /** Effective projectile display size at this level. */
  displaySize?: number
}

export interface ShopItem {
  id: string
  type: 'shot' | 'upgrade' | 'shield' | 'ability' | 'none'
  name: string
  price: number
  description: string
  iconKey: string
  iconFrame: number
  // Required for upgrade items that use a standalone image (not a spritesheet frame).
  iconPath?: string
  shotConfig?: ShotConfig
  effect?: UpgradeEffect
  /** Item only appears in the inventory tab, never in the shop. */
  inventoryOnly?: boolean
  /** Item is always treated as owned — no purchase required. */
  alwaysOwned?: boolean
  /** Three-level progression. Index 0 = level 1 (base), 1 = level 2, 2 = level 3. */
  levelStats?: readonly [LevelStats, LevelStats, LevelStats]
}
