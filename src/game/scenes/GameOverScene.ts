import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, wireButtonLabel, addCoinCounter } from '../utils/uiHelpers'
import { dropIn, dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { storageGet, storageSet } from '../utils/storage'

const SCALE = 3

export class GameOverScene extends Phaser.Scene {
  private achievementQueue!: { iconKey: string; name: string }[]

  constructor() {
    super('game-over-scene')
  }

  create(data: { score: number; newAchievements?: { iconKey: string; name: string }[] }) {
    this.achievementQueue = [...(data.newAchievements ?? [])]
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    this.cameras.main.fadeIn(600, 0, 0, 0)

    const prevBest = parseInt(storageGet('highScore') ?? '0', 10)
    const isNewBest = data.score > prevBest
    if (isNewBest) storageSet('highScore', String(data.score))
    const highScore = isNewBest ? data.score : prevBest

    addBackground(this)
    addCoinCounter(this)

    const fim  = this.add.image(cx - 65, cy - 130, 'gameover-fim').setScale(SCALE).setOrigin(0.5)
    const cat  = this.add.image(cx + 65, cy - 150, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)
    const de   = this.add.image(cx - 85, cy - 50,  'gameover-de').setScale(SCALE).setOrigin(0.5)
    const jogo = this.add.image(cx + 55, cy - 45,  'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    const labelStyle = { fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY }

    const scoreText = this.add
      .text(cx, cy + 105, `Altura: ${data.score}`, { fontSize: '26px', color: '#ffffff', fontFamily: FONT_FAMILY })
      .setOrigin(0.5)

    const bestColor = isNewBest ? '#ffd700' : '#aaaaaa'
    const bestLabel = isNewBest ? `Novo recorde: ${highScore}!` : `Recorde: ${highScore}`
    const bestText = this.add
      .text(cx, cy + 138, bestLabel, { fontSize: '18px', color: bestColor, fontFamily: FONT_FAMILY })
      .setOrigin(0.5)

    const btnSize = 80
    const gap = 40

    const btnHome = this.add
      .image(cx - btnSize / 2 - gap / 2, cy + 205, 'btn-home')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const btnPlay = this.add
      .image(cx + btnSize / 2 + gap / 2, cy + 205, 'btn-play')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelHome = this.add
      .text(cx - btnSize / 2 - gap / 2, cy + 180 + btnSize / 2 + 10, 'Inicio', labelStyle)
      .setOrigin(0.5, 0)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelPlay = this.add
      .text(cx + btnSize / 2 + gap / 2, cy + 180 + btnSize / 2 + 10, 'Jogar novamente', labelStyle)
      .setOrigin(0.5, 0)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const allElements: SceneObject[] = [fim, cat, de, jogo, scoreText, bestText, btnHome, btnPlay, labelHome, labelPlay]

    dropInFloat(this, fim,  { amplitude: 10, floatDuration: 1800, delay: 0   })
    dropInFloat(this, cat,  { amplitude: 8,  floatDuration: 2100, delay: 100 })
    dropInFloat(this, de,   { amplitude: 10, floatDuration: 1600, delay: 200 })
    dropInFloat(this, jogo, { amplitude: 9,  floatDuration: 2300, delay: 300 })
    dropIn(this, scoreText, 350)
    dropIn(this, bestText,  400)
    dropIn(this, btnHome,   450)
    dropIn(this, btnPlay,   500)
    dropIn(this, labelHome, 450)
    dropIn(this, labelPlay, 500)

    if (this.achievementQueue.length > 0) {
      this.time.delayedCall(1500, () => this.showNextAchievementToast())
    }

    wireButtonLabel(btnHome, labelHome, () => exitTo(this, 'menu-scene', allElements))
    wireButtonLabel(btnPlay, labelPlay, () => this.scene.start('main-scene'))
  }

  private showNextAchievementToast() {
    const next = this.achievementQueue.shift()
    if (!next) return

    const panelW = 270
    const panelH = 60
    const targetX = WORLD.width / 2
    const startX = WORLD.width + panelW / 2 + 10
    const panelY = 46

    const container = this.add.container(startX, panelY).setDepth(100)
    const panel = this.add.rectangle(0, 0, panelW, panelH, 0x222222, 0.92).setStrokeStyle(2, 0xffd700)
    const icon = this.add.image(-panelW / 2 + 36, 0, next.iconKey).setDisplaySize(42, 42)
    const label = this.add.text(-panelW / 2 + 64, -14, 'Conquista desbloqueada!', { fontSize: '10px', color: '#ffd700', fontFamily: FONT_FAMILY })
    const nameText = this.add.text(-panelW / 2 + 64, 2, next.name, { fontSize: '15px', color: '#ffffff', fontFamily: FONT_FAMILY })
    const hint = this.add.text(panelW / 2 - 8, panelH / 2 - 12, 'ver ›', { fontSize: '10px', color: '#ffd700', fontFamily: FONT_FAMILY }).setOrigin(1, 1)
    container.add([panel, icon, label, nameText, hint])

    container.setSize(panelW, panelH)
    container.setInteractive({ useHandCursor: true })
    container.on('pointerover', () => panel.setStrokeStyle(2, 0xffffff))
    container.on('pointerout', () => panel.setStrokeStyle(2, 0xffd700))
    container.on('pointerdown', () => {
      this.tweens.killTweensOf(container)
      this.time.removeAllEvents()
      this.scene.start('achievements-scene')
    })

    this.tweens.add({
      targets: container,
      x: targetX,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(2400, () => {
          this.tweens.add({
            targets: container,
            x: -(panelW / 2 + 10),
            duration: 350,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              container.destroy()
              this.showNextAchievementToast()
            },
          })
        })
      },
    })
  }
}
