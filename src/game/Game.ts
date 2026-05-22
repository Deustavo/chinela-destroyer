import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { MenuScene } from './scenes/MenuScene'
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
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: WORLD.gravity },
          debug: false,
        },
      },
      scene: [PreloadScene, MenuScene, MainScene, GameOverScene],
    })
  }
}
