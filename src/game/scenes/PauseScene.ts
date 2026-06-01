import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addModalOverlay } from '../utils/uiHelpers'
import { playSfx } from '../utils/AudioManager'
import { AudioVolumePanel } from '../utils/AudioVolumePanel'
import { t } from '../lang'

export class PauseScene extends Phaser.Scene {
  private audioPanel?: AudioVolumePanel

  constructor() {
    super('pause-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    addModalOverlay(this, 0, 0.75)

    this.add
      .text(cx, cy - 80, t('paused'), { fontSize: '42px', color: '#ffffff', fontStyle: 'bold', fontFamily: FONT_FAMILY })
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
      .text(cx + btnSize / 2 + gap / 2, cy + btnSize / 2 + 6, t('continue'), labelStyle)
      .setOrigin(0.5, 0)
      .setDepth(1)

    btnPlay.on('pointerover', () => btnPlay.setAlpha(1))
    btnPlay.on('pointerout', () => btnPlay.setAlpha(0.85))
    btnPlay.on('pointerdown', () => { playSfx(this, 'button-click'); this.startCountdown() })
    labelPlay.setInteractive({ cursor: 'pointer' }).on('pointerdown', () => { playSfx(this, 'button-click'); this.startCountdown() })

    const btnHome = this.add
      .image(cx - btnSize / 2 - gap / 2, cy + 20, 'btn-home')
      .setDisplaySize(btnSize, btnSize)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelHome = this.add
      .text(cx - btnSize / 2 - gap / 2, cy + btnSize / 2 + 6, t('home'), labelStyle)
      .setOrigin(0.5, 0)
      .setDepth(1)

    btnHome.on('pointerover', () => btnHome.setAlpha(1))
    btnHome.on('pointerout', () => btnHome.setAlpha(0.85))
    btnHome.on('pointerdown', () => { playSfx(this, 'button-click'); this.goHome() })
    labelHome.setInteractive({ cursor: 'pointer' }).on('pointerdown', () => { playSfx(this, 'button-click'); this.goHome() })

    const audioBtn = this.add.image(cx, cy + 112, 'btn-audio')
      .setDisplaySize(40, 40)
      .setDepth(1)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.85)

    this.add.text(cx, cy + 132, t('volume'), labelStyle)
      .setOrigin(0.5, 0)
      .setDepth(1)

    audioBtn.on('pointerover', () => audioBtn.setAlpha(1))
    audioBtn.on('pointerout', () => audioBtn.setAlpha(0.85))
    audioBtn.on('pointerdown', () => {
      playSfx(this, 'button-click')
      this.audioPanel?.show()
    })

    this.audioPanel = new AudioVolumePanel(this)

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
    const D = 10

    const overlay = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.6)
      .setDepth(D).setInteractive()

    const panel = this.add.image(cx, cy, 'modal-bg2')
      .setDisplaySize(300, 175).setDepth(D + 1)

    const msg = this.add.text(cx, cy - 44, t('quit_confirm'), {
      fontSize: '20px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(D + 2)

    const sub = this.add.text(cx, cy - 18, t('progress_lost'), {
      fontSize: '13px', color: '#aaaaaa', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(D + 2)

    const btnW = 120
    const btnH = 44
    const gap = 12
    const btnY = cy + 46

    const btnYesImg = this.add.image(cx - btnW / 2 - gap / 2, btnY, 'btn-primary')
      .setDisplaySize(btnW, btnH).setDepth(D + 2).setAlpha(0.9).setInteractive({ useHandCursor: true })
    const btnYesTxt = this.add.text(cx - btnW / 2 - gap / 2, btnY, t('quit'), {
      fontSize: '18px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(D + 3).setInteractive({ useHandCursor: true })

    const btnNoImg = this.add.image(cx + btnW / 2 + gap / 2, btnY, 'btn-secondary')
      .setDisplaySize(btnW, btnH).setDepth(D + 2).setAlpha(0.9).setInteractive({ useHandCursor: true })
    const btnNoTxt = this.add.text(cx + btnW / 2 + gap / 2, btnY, t('cancel'), {
      fontSize: '18px', color: '#111111', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(D + 3).setInteractive({ useHandCursor: true })

    const wireHover = (img: Phaser.GameObjects.Image, txt: Phaser.GameObjects.Text) => {
      const over = () => { img.setAlpha(1); txt.setAlpha(1) }
      const out  = () => { img.setAlpha(0.9); txt.setAlpha(0.9) }
      img.on('pointerover', over).on('pointerout', out)
      txt.on('pointerover', over).on('pointerout', out)
    }
    wireHover(btnYesImg, btnYesTxt)
    wireHover(btnNoImg, btnNoTxt)

    const confirmExit = () => {
      playSfx(this, 'button-click')
      this.scene.stop('main-scene')
      this.scene.stop()
      this.scene.start('menu-scene')
    }
    const cancelDialog = () => {
      playSfx(this, 'button-click')
      overlay.destroy(); panel.destroy(); msg.destroy()
      sub.destroy(); btnYesImg.destroy(); btnYesTxt.destroy()
      btnNoImg.destroy(); btnNoTxt.destroy()
    }

    btnYesImg.on('pointerdown', confirmExit)
    btnYesTxt.on('pointerdown', confirmExit)
    btnNoImg.on('pointerdown', cancelDialog)
    btnNoTxt.on('pointerdown', cancelDialog)
  }
}
