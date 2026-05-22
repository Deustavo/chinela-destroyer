export const WORLD = {
  width: 1280,
  height: 720,
  gravity: 800,
  backgroundColor: '#1d1d1d',
  groundColor: 0x444444,
  groundY: 680,
  groundWidth: 1280,
  groundHeight: 60,
  boundsExtent: 500000,
} as const

export const PLATFORMS = {
  width: 110,
  height: 16,
  color: 0x55bb55,
  minGapY: 140,
  maxGapY: 190,
  minX: 20,
  maxX: 1150,
  maxHorizontalReach: 380,
  initialCount: 8,
  spawnAhead: 500,
  despawnMargin: 150,
} as const

export const SCROLL = {
  initialSpeed: 45,
  speedIncrement: 1.5,
  maxSpeed: 200,
  upperHalfBoostFactor: 6.0,
} as const

export const ENEMY = {
  screenY: 80,
  speed: 140,
  displayWidth: 128,
  displayHeight: 128,
  frameDuration: 0.35,
  throwInterval: 2.2,
  projectileSpeed: 380,
  trapDisplaySize: 56,
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

export const PLAYER = {
  startX: 640,
  startY: 560,
  speed: 300,
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
