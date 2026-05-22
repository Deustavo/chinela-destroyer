import Phaser from 'phaser'
import { WORLD } from '../config/constants'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    const logo = this.add
      .image(cx, cy - 60, 'menu-logo')
      .setScale(2.2)
      .setDepth(1)

    const chinela = this.add
      .image(cx - 80, cy + 40, 'menu-chinela')
      .setScale(3.2)
      .setDepth(2)

    const pera = this.add
      .image(cx + 80, cy - 180, 'menu-pera')
      .setScale(2)
      .setDepth(2)

    const btn = this.add
      .image(cx, cy + 190, 'menu-play-btn')
      .setScale(1.8)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => btn.setScale(2.0))
    btn.on('pointerout', () => btn.setScale(1.8))
    btn.on('pointerdown', () => this.scene.start('main-scene'))

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('main-scene'))
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('main-scene'))

    this.addFloat(logo, 8, 2000, 0)
    this.addFloat(chinela, 12, 1800, 300)
    this.addFloat(pera, 10, 2200, 600)
    this.addFloat(btn, 6, 1600, 150)
  }

  private addFloat(
    obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    amplitude: number,
    duration: number,
    delay: number,
  ) {
    this.tweens.add({
      targets: obj,
      y: obj.y - amplitude,
      duration,
      delay,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }
}
