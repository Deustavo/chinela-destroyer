export const WORLD = {
  width: 405,
  height: 720,
  gravity: 800,
  backgroundColor: '#1d1d1d',
  groundColor: 0x444444,
  groundY: 580,
  groundWidth: 405,
  groundHeight: 60,
  boundsExtent: 500000,
} as const

export const PLATFORMS = {
  width: 80,
  height: 8,
  textureKey: 'platform-grass1',
  texturePath: '/assets/platforms/grass1.png',
  movingTextureKey: 'platform-grass2',
  movingTexturePath: '/assets/platforms/grass2.png',
  textureHeight: 40,
  textureDrawingOffset: 32,
  minGapY: 140,
  maxGapY: 190,
  minX: 20,
  maxX: 385,
  maxHorizontalReach: 130,
  initialCount: 8,
  spawnAhead: 500,
  despawnMargin: 150,
  movingChance: 0.3,
  movingSpeed: 80,
} as const

export const SCROLL = {
  initialSpeed: 45,
  speedIncrement: 1.5,
  maxSpeed: 200,
  upperHalfBoostFactor: 6.0,
} as const

export const ENEMY = {
  screenY: 80,
  speed: 100,
  displayWidth: 96,
  displayHeight: 96,
  frameDuration: 0.35,
  throwInterval: 2.2,
  projectileSpeed: 300,
  trapDisplaySize: 60,
  trapHitboxSize: 30,
  blinkWindow: 1.0,
  blinkCount: 2,
  bobAmplitude: 8,
  bobSpeed: 1.8,
  spriteKey: 'pera',
  spritesheet: {
    path: '/assets/enemy/SpriteSheetPera.png',
    frameWidth: 128,
    frameHeight: 128,
  },
  trapsKey: 'traps',
  trapsSheet: {
    path: '/assets/enemy/SpriteSheetTraps.png',
    frameWidth: 128,
    frameHeight: 128,
  },
} as const

export const BOSS_SHIP = {
  spriteKey: 'boss-ship',
  spritesheet: {
    path: '/assets/enemy/SpriteSheetShip.png',
    frameWidth: 640,
    frameHeight: 180,
  },
  displayWidth: 405,
  displayHeight: Math.round(180 * (405 / 640)),
  frameDuration: 0.5,
  triggerHeight: 999,
  arenaScreenY: 520,
} as const

export const BOSSES = [
  { triggerHeight: 999,  vitalsCount: 3, arenaType: 'two-static' },
  { triggerHeight: 1999, vitalsCount: 5, arenaType: 'two-static' },
  { triggerHeight: 2999, vitalsCount: 5, arenaType: 'moving'     },
] as const

export const SHOT = {
  spriteKey: 'simple-shot',
  spritePath: '/assets/player/simple-shot.png',
  btnKey: 'btn-shot',
  btnPath: '/assets/buttons/shot.png',
  speed: 600,
  displaySize: 32,
  cooldown: 1.0,
} as const

export const PLAYER = {
  startX: 202,
  startY: 460,
  speed: 200,
  jumpVelocity: -820,
  riseGravityMultiplier: 2.0,
  fallGravityMultiplier: 2.5,
  spriteKey: 'chinela',
  spritesheet: {
    path: '/assets/player/chinela.png',
    frameWidth: 128,
    frameHeight: 128,
  },
  frames: {
    idle: [0],
    walk: [2, 3, 4],
    jumpUp: [5],
    jumpDown: [6],
  },
  animFrameRates: {
    idle: 1,
    walk: 10,
    jump: 1,
  },
} as const
