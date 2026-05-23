import Phaser from 'phaser'
import { WORLD } from '../config/constants'

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('credits-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    const title = this.add
      .text(cx, cy, 'Créditos', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Patrick Hand, cursive',
      })
      .setOrigin(0.5)

    const btnBack = this.add
      .image(cx, cy + 180, 'btn-home')
      .setDisplaySize(64, 64)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    btnBack.on('pointerover', () => btnBack.setAlpha(1))
    btnBack.on('pointerout', () => btnBack.setAlpha(0.85))
    btnBack.on('pointerdown', () => this.exitTo('menu-scene', [title, btnBack]))

    this.dropIn(title,   0)
    this.dropIn(btnBack, 100)
  }

  private dropIn(obj: Phaser.GameObjects.Image | Phaser.GameObjects.Text, delay: number) {
    const finalY = obj.y
    obj.y = -Math.abs(obj.displayHeight) - 20

    this.tweens.add({
      targets: obj,
      y: finalY,
      duration: 900,
      delay,
      ease: 'Cubic.easeOut',
    })
  }

  private exitTo(scene: string, elements: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[]) {
    elements.forEach((el, i) => {
      this.tweens.killTweensOf(el)
      this.tweens.add({
        targets: el,
        y: -WORLD.height,
        duration: 600,
        delay: i * 40,
        ease: 'Cubic.easeIn',
        onComplete: i === elements.length - 1 ? () => this.scene.start(scene) : undefined,
      })
    })
  }
}
