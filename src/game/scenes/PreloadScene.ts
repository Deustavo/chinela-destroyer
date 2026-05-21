import Phaser from 'phaser'
import { PLAYER } from '../config/constants'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload-scene')
  }

  preload() {
    const { spritesheet } = PLAYER

    this.load.spritesheet(PLAYER.spriteKey, spritesheet.path, {
      frameWidth: spritesheet.frameWidth,
      frameHeight: spritesheet.frameHeight,
    })
  }

  create() {
    this.scene.start('main-scene')
  }
}
