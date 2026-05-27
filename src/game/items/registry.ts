import type { ShopItem } from './types'

// ── Add new purchasable items here. ──────────────────────────────────────────
//
// shot items  → replace the player's projectile when owned (highest price wins).
// upgrade items → apply their effect on top of whichever shot is active.
//
// PreloadScene loads spritesheets for shot items and iconPath images for upgrade items.
// Player registers animations for all shot items automatically.

export const ITEM_REGISTRY: ShopItem[] = [
  {
    id: 'shield',
    type: 'shield',
    name: 'Ultima esperança',
    price: 500,
    description: 'Escudo absorve 1 tiro\n(recarga 10s)',
    iconKey: 'shield1',
    iconFrame: 0,
  },
  {
    id: 'special-shot',
    type: 'shot',
    name: 'Arco do Julgamento',
    price: 1000,
    description: 'Cooldown pela metade',
    iconKey: 'player-shot2',
    iconFrame: 0,
    shotConfig: {
      spriteKey: 'player-shot2',
      flyAnimKey: 'special-shot-fly',
      impactAnimKey: 'special-shot-impact',
      spritesheet: {
        path: '/assets/player/SpriteSheetShot2.png',
        frameWidth: 64,
        frameHeight: 64,
      },
      flyFrames: [0, 1, 2, 3, 4],
      impactFrames: [5, 6, 7],
      flyFrameRate: 12,
      impactFrameRate: 16,
      speed: 600,
      displaySize: 48,
      cooldown: 0.5,
    },
  },
]
