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
}

// Multiplier-based stat modifiers that stack with upgrades.
// value is a multiplier: 0.8 = 20% reduction, 1.2 = 20% increase.
export interface UpgradeEffect {
  stat: 'shotCooldownMultiplier' | 'shotSpeedMultiplier' | 'moveSpeedMultiplier' | 'jumpMultiplier'
  value: number
}

export interface ShopItem {
  id: string
  type: 'shot' | 'upgrade'
  name: string
  price: number
  description: string
  iconKey: string
  iconFrame: number
  // Required for upgrade items that use a standalone image (not a spritesheet frame).
  iconPath?: string
  shotConfig?: ShotConfig
  effect?: UpgradeEffect
}
