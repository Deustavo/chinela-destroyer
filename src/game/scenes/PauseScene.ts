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
      .text(cx, cy - 80, 'PAUSADO', { fontSize: '42px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(1)

    const btnBg = this.add.rectangle(cx, cy + 20, 200, 56, 0x336633).setDepth(1)
    const btnText = this.add
      .text(cx, cy + 20, 'CONTINUAR', { fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(2)

    btnBg.setInteractive({ cursor: 'pointer' })
    btnBg.on('pointerover', () => btnBg.setFillStyle(0x44aa44))
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x336633))
    btnBg.on('pointerdown', () => this.startCountdown())

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).once('down', () => this.startCountdown())

    void btnText
  }

  private startCountdown() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    this.children.getAll().forEach((c) => c.destroy())

    const overlay = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.5)
    overlay.setDepth(0)

    const countText = this.add
      .text(cx, cy, '3', { fontSize: '100px', color: '#ffffff', fontStyle: 'bold' })
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
