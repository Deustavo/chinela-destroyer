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
    const g = this.make.graphics()
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 1, 1)
    g.generateTexture('pixel', 1, 1)
    g.setVisible(false)
    g.destroy()

    this.scene.start('menu-scene')
  }
}
