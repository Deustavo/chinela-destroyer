import Phaser from 'phaser'
import { PLAYER, ENEMY } from '../config/constants'

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

    this.load.spritesheet(ENEMY.spriteKey, ENEMY.spritesheet.path, {
      frameWidth: ENEMY.spritesheet.frameWidth,
      frameHeight: ENEMY.spritesheet.frameHeight,
    })

    this.load.spritesheet(ENEMY.trapsKey, ENEMY.trapsSheet.path, {
      frameWidth: ENEMY.trapsSheet.frameWidth,
      frameHeight: ENEMY.trapsSheet.frameHeight,
    })

    this.load.image('menu-logo', '/assets/homeScreen/logo.png')
    this.load.image('menu-chinela', '/assets/homeScreen/chinela.png')
    this.load.image('menu-pera', '/assets/homeScreen/pera.png')
    this.load.image('menu-play-btn', '/assets/homeScreen/play.png')

    this.load.image('gameover-fim', '/assets/gameOverScreen/fim.png')
    this.load.image('gameover-de', '/assets/gameOverScreen/de.png')
    this.load.image('gameover-jogo', '/assets/gameOverScreen/jogo.png')
    this.load.image('gameover-chinela', '/assets/gameOverScreen/chinela.png')

    this.load.image('btn-left', '/assets/buttons/left.png')
    this.load.image('btn-right', '/assets/buttons/right.png')
    this.load.image('btn-up', '/assets/buttons/up.png')
    this.load.image('btn-pause', '/assets/buttons/pause.png')
    this.load.image('btn-play', '/assets/buttons/play.png')
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
