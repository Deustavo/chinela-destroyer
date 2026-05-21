export const WORLD = {
  width: 1280,
  height: 720,
  gravity: 800,
  backgroundColor: '#1d1d1d',
  groundColor: 0x444444,
  groundY: 680,
  groundWidth: 1280,
  groundHeight: 80,
} as const

export const PLAYER = {
  startX: 200,
  startY: 400,
  speed: 300,
  jumpVelocity: -500,
  spriteKey: 'chinela',
  spritesheet: {
    path: '/assets/player/chinela.png',
    frameWidth: 64,
    frameHeight: 64,
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
