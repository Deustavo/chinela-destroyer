import Phaser from 'phaser'
import { WORLD } from '../config/constants'


export class PauseScene extends Phaser.Scene {
  constructor() {
    super('pause-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    const overlay = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.6)
    overlay.setDepth(0)

    this.add
      .text(cx, cy - 80, 'PAUSADO', { fontSize: '42px', color: '#ffffff', fontStyle: 'bold', fontFamily: '"Comic Neue", "Comic Sans MS", cursive' })
      .setOrigin(0.5)
      .setDepth(1)

    const btnSize = 80
    const btnImg = this.add
      .image(cx, cy + 20, 'btn-play')
      .setDisplaySize(btnSize, btnSize)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })

    btnImg.on('pointerover', () => btnImg.setAlpha(1))
    btnImg.on('pointerout', () => btnImg.setAlpha(0.85))
    btnImg.on('pointerdown', () => this.startCountdown())
    btnImg.setAlpha(0.85)

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).once('down', () => this.startCountdown())
  }

  private startCountdown() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    this.children.getAll().forEach((c) => c.destroy())

    const overlay = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.5)
    overlay.setDepth(0)

    const countText = this.add
      .text(cx, cy, '3', { fontSize: '100px', color: '#ffffff', fontStyle: 'bold', fontFamily: '"Comic Neue", "Comic Sans MS", cursive' })
      .setOrigin(0.5)
      .setDepth(1)

    const counts = [3, 2, 1]
    let index = 0

    const showNext = () => {
      countText.setText(String(counts[index]))
      this.tweens.add({
        targets: countText,
        scaleX: { from: 1.4, to: 0.8 },
        scaleY: { from: 1.4, to: 0.8 },
        alpha: { from: 1, to: 0.3 },
        duration: 800,
        ease: 'Quad.easeIn',
        onComplete: () => {
          index++
          if (index < counts.length) {
            countText.setScale(1).setAlpha(1)
            showNext()
          } else {
            this.resume()
          }
        },
      })
    }

    showNext()
  }

  private resume() {
    this.scene.stop()
    this.scene.resume('main-scene')
  }
}
