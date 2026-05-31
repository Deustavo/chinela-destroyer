import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addModalOverlay } from '../utils/uiHelpers'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('pause-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    addModalOverlay(this)

    this.add
      .text(cx, cy - 80, 'PAUSADO', { fontSize: '42px', color: '#ffffff', fontStyle: 'bold', fontFamily: FONT_FAMILY })
      .setOrigin(0.5)
      .setDepth(1)

    const btnSize = 80
    const gap = 30
    const labelStyle = { fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY }

    const btnPlay = this.add
      .image(cx + btnSize / 2 + gap / 2, cy + 20, 'btn-play')
      .setDisplaySize(btnSize, btnSize)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelPlay = this.add
      .text(cx + btnSize / 2 + gap / 2, cy + btnSize / 2 + 6, 'Continuar', labelStyle)
      .setOrigin(0.5, 0)
      .setDepth(1)

    btnPlay.on('pointerover', () => btnPlay.setAlpha(1))
    btnPlay.on('pointerout', () => btnPlay.setAlpha(0.85))
    btnPlay.on('pointerdown', () => { this.sound.play('button-click'); this.startCountdown() })
    labelPlay.setInteractive({ cursor: 'pointer' }).on('pointerdown', () => { this.sound.play('button-click'); this.startCountdown() })

    const btnHome = this.add
      .image(cx - btnSize / 2 - gap / 2, cy + 20, 'btn-home')
      .setDisplaySize(btnSize, btnSize)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelHome = this.add
      .text(cx - btnSize / 2 - gap / 2, cy + btnSize / 2 + 6, 'Início', labelStyle)
      .setOrigin(0.5, 0)
      .setDepth(1)

    btnHome.on('pointerover', () => btnHome.setAlpha(1))
    btnHome.on('pointerout', () => btnHome.setAlpha(0.85))
    btnHome.on('pointerdown', () => { this.sound.play('button-click'); this.goHome() })
    labelHome.setInteractive({ cursor: 'pointer' }).on('pointerdown', () => { this.sound.play('button-click'); this.goHome() })

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).once('down', () => this.startCountdown())
  }

  private startCountdown() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    this.children.getAll().forEach((c) => c.destroy())

    addModalOverlay(this, 0, 0.5)

    const countText = this.add
      .text(cx, cy, '3', { fontSize: '100px', color: '#ffffff', fontStyle: 'bold', fontFamily: FONT_FAMILY })
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

  private goHome() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    const overlay = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.6).setDepth(10).setInteractive()
    const panel = this.add.rectangle(cx, cy, 280, 160, 0x111111, 1).setStrokeStyle(2, 0x555555).setDepth(11)
    const msg = this.add.text(cx, cy - 38, 'Sair para o Início?', {
      fontSize: '20px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(12)
    const sub = this.add.text(cx, cy - 10, 'O progresso atual será perdido.', {
      fontSize: '13px', color: '#aaaaaa', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(12)

    const btnYes = this.add.text(cx - 54, cy + 44, 'Sair', {
      fontSize: '18px', color: '#ff6666', fontFamily: FONT_FAMILY,
      backgroundColor: '#2a1010', padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true })

    const btnNo = this.add.text(cx + 54, cy + 44, 'Cancelar', {
      fontSize: '18px', color: '#ffffff', fontFamily: FONT_FAMILY,
      backgroundColor: '#1a1a2a', padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true })

    btnYes.on('pointerdown', () => {
      this.sound.play('button-click')
      this.scene.stop('main-scene')
      this.scene.stop()
      this.scene.start('menu-scene')
    })
    btnNo.on('pointerdown', () => {
      this.sound.play('button-click')
      overlay.destroy(); panel.destroy(); msg.destroy()
      sub.destroy(); btnYes.destroy(); btnNo.destroy()
    })
  }
}
