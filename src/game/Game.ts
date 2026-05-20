import Phaser from 'phaser'
import { MainScene } from './scenes/MainScene'

export class Game extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      backgroundColor: '#1d1d1d',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 800 },
          debug: false,
        },
      },
      scene: [MainScene],
    })
  }
}