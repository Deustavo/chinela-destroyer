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
    id: 'nada',
    type: 'none',
    name: 'Nada',
    price: 0,
    description: '',
    iconKey: 'pixel',
    iconFrame: 0,
    inventoryOnly: true,
    alwaysOwned: true,
  },
  {
    id: 'pomodoro-shot',
    type: 'shot',
    name: 'Pomodoro',
    price: 10,
    description: 'Tiro gigante!\nAtordoa a Pera por 3s',
    iconKey: 'player-shot3',
    iconFrame: 0,
    shotConfig: {
      spriteKey: 'player-shot3',
      flyAnimKey: 'pomodoro-shot-fly',
      impactAnimKey: 'pomodoro-shot-impact',
      spritesheet: {
        path: '/assets/player/SpriteSheetShot3.png',
        frameWidth: 64,
        frameHeight: 64,
      },
      flyFrames: [0, 1, 2],
      impactFrames: [3, 4, 5],
      flyFrameRate: 12,
      impactFrameRate: 16,
      speed: 600,
      displaySize: 96,
      cooldown: 4,
      stunDuration: 1.5,
    },
    levelStats: [
      { upgradeCost: 0,  description: 'Cooldown: 4s',   cooldown: 4   },
      { upgradeCost: 30, description: 'Cooldown: 3,5s', cooldown: 3.5 },
      { upgradeCost: 60, description: 'Cooldown: 3s',   cooldown: 3   },
    ],
  },
  {
    id: 'shield',
    type: 'shield',
    name: 'Segunda chance',
    price: 50,
    description: 'Escudo absorve 1 tiro\n(recarga 10s)',
    iconKey: 'shield1',
    iconFrame: 0,
    levelStats: [
      { upgradeCost: 0,   description: 'Recarga: 12s', cooldown: 12 },
      { upgradeCost: 80,  description: 'Recarga: 10s', cooldown: 10 },
      { upgradeCost: 160, description: 'Recarga: 8s',  cooldown: 8  },
    ],
  },
  {
    id: 'anjo-caido',
    type: 'ability',
    name: 'Anjo Caído',
    price: 100,
    description: 'Pulo duplo!\nAsas aparecem no 2º salto',
    iconKey: 'wings1',
    iconFrame: 0,
    levelStats: [
      { upgradeCost: 0,   description: 'Recarga: 4s', cooldown: 4 },
      { upgradeCost: 150, description: 'Recarga: 2s', cooldown: 2 },
      { upgradeCost: 300, description: 'Sem recarga', cooldown: 0 },
    ],
  },
  {
    id: 'special-shot',
    type: 'shot',
    name: 'Bolimbolacho',
    price: 200,
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
    levelStats: [
      { upgradeCost: 0,   description: 'Normal', displaySize: 48 },
      { upgradeCost: 300, description: 'Maiorzinho', displaySize: 60 },
      { upgradeCost: 600, description: 'GRANDÃO', displaySize: 80 },
    ],
  },
]
