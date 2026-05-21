import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { MainScene } from './scenes/MainScene'
import { GameOverScene } from './scenes/GameOverScene'
import { WORLD } from './config/constants'

export class Game extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      width: WORLD.width,
      height: WORLD.height,
      backgroundColor: WORLD.backgroundColor,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: WORLD.gravity },
          debug: false,
        },
      },
      scene: [PreloadScene, MainScene, GameOverScene],
    })
  }
}
