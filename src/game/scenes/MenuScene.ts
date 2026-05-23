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
      .image(cx, cy + 180, 'menu-play-btn')
      .setScale(1.8)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    const btnCredits = this.add
      .image(cx, cy + 270, 'menu-credits-btn')
      .setScale(1.8)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    // Halve hitbox height for both buttons (centered)
    for (const b of [btn, btnCredits]) {
      const ha = b.input!.hitArea as Phaser.Geom.Rectangle
      ha.y += ha.height / 4
      ha.height /= 2
    }

    const all = [logo, chinela, pera, btn, btnCredits]

    btn.on('pointerover', () => btn.setScale(2.0))
    btn.on('pointerout', () => btn.setScale(1.8))
    btn.on('pointerdown', () => this.exitTo('main-scene', all))

    btnCredits.on('pointerover', () => btnCredits.setScale(1.65))
    btnCredits.on('pointerout', () => btnCredits.setScale(1.5))
    btnCredits.on('pointerdown', () => this.exitTo('credits-scene', all))

    this.input.keyboard?.once('keydown-SPACE', () => this.exitTo('main-scene', all))
    this.input.keyboard?.once('keydown-ENTER', () => this.exitTo('main-scene', all))

    this.dropIn(logo,       { amplitude: 8,  floatDuration: 2000, delay: 0   })
    this.dropIn(chinela,    { amplitude: 12, floatDuration: 1800, delay: 120 })
    this.dropIn(pera,       { amplitude: 10, floatDuration: 2200, delay: 240 })
    this.dropIn(btn,        { amplitude: 6,  floatDuration: 1600, delay: 360 })
    this.dropIn(btnCredits, { amplitude: 5,  floatDuration: 1700, delay: 440 })
  }

  private exitTo(scene: string, elements: Phaser.GameObjects.Image[]) {
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

  private dropIn(
    obj: Phaser.GameObjects.Image,
    opts: { amplitude: number; floatDuration: number; delay: number },
  ) {
    const finalY = obj.y
    obj.y = -obj.displayHeight

    this.tweens.add({
      targets: obj,
      y: finalY,
      duration: 900,
      delay: opts.delay,
      ease: 'Cubic.easeOut',
      onComplete: () => this.addFloat(obj, opts.amplitude, opts.floatDuration),
    })
  }

  private addFloat(
    obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    amplitude: number,
    duration: number,
  ) {
    this.tweens.add({
      targets: obj,
      y: obj.y - amplitude,
      duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }
}
