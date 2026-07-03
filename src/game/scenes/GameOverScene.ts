import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, wireButtonLabel, addCoinCounter, bindEscapeKey, applySceneMuffle } from '../utils/uiHelpers'
import { dropIn, dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { storageGet, storageSet, storageRemove, parseJson } from '../utils/storage'
import { CoinManager } from '../utils/CoinManager'
import { PurchaseManager } from '../utils/PurchaseManager'
import { playSfx } from '../utils/AudioManager'
import { promptForName } from '../utils/NameEntryModal'
import { isConfigured, submitScore, type GameMode } from '../utils/Leaderboard'
import { t } from '../lang'

const SCALE = 3

export class GameOverScene extends Phaser.Scene {
  private achievementQueue!: { iconKey: string; id: string }[]
  private toastTimer: Phaser.Time.TimerEvent | null = null

  constructor() {
    super('game-over-scene')
  }

  create(data: { score: number; newAchievements?: { iconKey: string; id: string }[]; gameMode?: string }) {
    this.achievementQueue = [...(data.newAchievements ?? [])]
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    this.cameras.main.fadeIn(600, 0, 0, 0)

    const isSemFim = data.gameMode === 'semFim'
    const gameMode: GameMode = isSemFim ? 'semFim' : 'normal'
    const highScoreKey = isSemFim ? 'highScoreSemFim' : 'highScore'
    const rawBest = parseInt(storageGet(highScoreKey) ?? '0', 10)
    const prevBest = isNaN(rawBest) ? 0 : rawBest
    if (isNaN(rawBest)) storageRemove(highScoreKey)
    const isNewBest = data.score > prevBest
    if (isNewBest) storageSet(highScoreKey, String(data.score))
    const highScore = isNewBest ? data.score : prevBest

    addBackground(this)
    addCoinCounter(this)
    applySceneMuffle(this)

    const fim  = this.add.image(cx - 65, cy - 130, 'gameover-fim').setScale(SCALE).setOrigin(0.5)
    const cat  = this.add.image(cx + 65, cy - 150, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)
    const de   = this.add.image(cx - 85, cy - 50,  'gameover-de').setScale(SCALE).setOrigin(0.5)
    const jogo = this.add.image(cx + 55, cy - 45,  'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    const labelStyle = { fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY }

    const scoreText = this.add
      .text(cx, cy + 105, t('height', data.score), { fontSize: '26px', color: '#ffffff', fontFamily: FONT_FAMILY })
      .setOrigin(0.5)

    const bestColor = isNewBest ? '#ffd700' : '#aaaaaa'
    const bestLabel = isNewBest ? t('new_record', highScore) : t('record', highScore)
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
      .text(cx - btnSize / 2 - gap / 2, cy + 180 + btnSize / 2 + 10, t('home'), labelStyle)
      .setOrigin(0.5, 0)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelPlay = this.add
      .text(cx + btnSize / 2 + gap / 2, cy + 180 + btnSize / 2 + 10, t('play_again'), labelStyle)
      .setOrigin(0.5, 0)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const isMobile = this.sys.game.device.input.touch
    const spaceHint = this.add
      .text(cx, cy + 300, t('space_hint'), { fontSize: '14px', color: '#aaaaaa', fontFamily: FONT_FAMILY })
      .setOrigin(0.5)
      .setVisible(!isMobile)

    const allElements: SceneObject[] = [fim, cat, de, jogo, scoreText, bestText, btnHome, btnPlay, labelHome, labelPlay, spaceHint]

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
    dropIn(this, spaceHint, 550)

    const shouldShowShopTutorial =
      storageGet('shopTutorialSeen') === null &&
      CoinManager.getTotal() >= 10 &&
      !PurchaseManager.has('pomodoro-shot')

    if (shouldShowShopTutorial) {
      storageSet('shopTutorialSeen', '1')
      this.time.delayedCall(1500, () => this.showShopTutorialModal())
    }

    if (this.achievementQueue.length > 0) {
      const achievementDelay = shouldShowShopTutorial ? 4500 : 1500
      this.toastTimer = this.time.delayedCall(achievementDelay, () => this.showNextAchievementToast())
    }

    const playAgain = () => {
      playSfx(this, 'button-click')
      if (isSemFim) {
        exitTo(this, 'main-scene', allElements, { gameMode: 'semFim' })
      } else {
        const unlockedStages = parseJson<number[]>(storageGet('normalStagesUnlocked'), [0])
        const highestStage = Math.max(...unlockedStages)
        exitTo(this, 'main-scene', allElements, { gameMode: 'normal', startStage: highestStage })
      }
    }

    const backToMenu = () => { playSfx(this, 'button-click'); exitTo(this, 'menu-scene', allElements) }

    // Keyboard shortcuts are bound only after any name-entry modal is dismissed,
    // so SPACE/ESC don't fire while the player is typing their name.
    const wireKeys = () => {
      this.input.keyboard!.once('keydown-SPACE', playAgain)
      bindEscapeKey(this, backToMenu)
    }

    wireButtonLabel(btnHome, labelHome, backToMenu)
    wireButtonLabel(btnPlay, labelPlay, playAgain)

    if (isNewBest && data.score > 0 && isConfigured()) {
      this.time.delayedCall(650, () => { void this.promptAndSubmit(data.score, gameMode).then(wireKeys) })
    } else {
      wireKeys()
    }
  }

  private async promptAndSubmit(score: number, mode: GameMode) {
    const defaultName = storageGet('playerName') ?? ''
    const name = await promptForName(this, defaultName)
    if (name) {
      storageSet('playerName', name)
      void submitScore(name, score, mode)
    }
  }

  private showShopTutorialModal() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    const overlay = this.add
      .rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.72)
      .setDepth(160)
      .setInteractive()

    const panelW = 290
    const panelH = 220
    const panel = this.add
      .rectangle(cx, cy, panelW, panelH, 0x111111, 0.97)
      .setStrokeStyle(2, 0xffd700, 1)
      .setDepth(161)

    const titleTxt = this.add
      .text(cx, cy - 72, t('shop_tutorial_title'), {
        fontSize: '20px', color: '#ffd700',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(162)

    const bodyTxt = this.add
      .text(cx, cy - 43, t('shop_tutorial_body'), {
        fontSize: '15px', color: '#ffffff', align: 'center',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(162)

    const iconBg = this.add
      .rectangle(cx, cy + 11, 58, 58, 0x222222)
      .setStrokeStyle(2, 0xffd700)
      .setDepth(162)

    const icon = this.add
      .image(cx, cy + 11, 'player-shot3', 0)
      .setDisplaySize(44, 44)
      .setDepth(163)

    const btnBg = this.add
      .image(cx, cy + 82, 'btn-primary')
      .setDisplaySize(176, 44)
      .setDepth(162)
      .setInteractive({ useHandCursor: true })

    const btnTxt = this.add
      .text(cx, cy + 82, t('go_to_shop'), {
        fontSize: '17px', color: '#ffffff',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(163)

    const closeTxt = this.add
      .text(cx + panelW / 2 - 18, cy - panelH / 2 + 18, '×', {
        fontSize: '22px', color: '#888888', fontFamily: FONT_FAMILY,
      })
      .setOrigin(0.5)
      .setDepth(163)
      .setInteractive({ useHandCursor: true })

    const modalObjs = [overlay, panel, titleTxt, bodyTxt, iconBg, icon, btnBg, btnTxt, closeTxt]
    modalObjs.forEach(o => o.setAlpha(0))
    this.tweens.add({ targets: modalObjs, alpha: 1, duration: 300 })

    const dismiss = () => {
      this.tweens.add({
        targets: modalObjs, alpha: 0, duration: 250,
        onComplete: () => modalObjs.forEach(o => o.destroy()),
      })
    }

    const goToShop = () => {
      modalObjs.forEach(o => o.destroy())
      this.scene.start('shop-scene', { tab: 'shop', shopTutorial: true })
    }

    closeTxt.on('pointerdown', dismiss)
    overlay.on('pointerdown', dismiss)
    btnBg.on('pointerdown', goToShop)
    btnTxt.on('pointerdown', goToShop)
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
    const label = this.add.text(-panelW / 2 + 64, -14, t('achievement_unlocked'), { fontSize: '10px', color: '#ffd700', fontFamily: FONT_FAMILY })
    const nameText = this.add.text(-panelW / 2 + 64, 2, t(`achievement.${next.id}.name`), { fontSize: '15px', color: '#ffffff', fontFamily: FONT_FAMILY })
    const hint = this.add.text(panelW / 2 - 8, panelH / 2 - 12, t('see'), { fontSize: '10px', color: '#ffd700', fontFamily: FONT_FAMILY }).setOrigin(1, 1)
    container.add([panel, icon, label, nameText, hint])

    container.setSize(panelW, panelH)
    container.setInteractive({ useHandCursor: true })
    container.on('pointerover', () => panel.setStrokeStyle(2, 0xffffff))
    container.on('pointerout', () => panel.setStrokeStyle(2, 0xffd700))
    container.on('pointerdown', () => {
      this.tweens.killTweensOf(container)
      this.toastTimer?.remove(false)
      this.toastTimer = null
      this.scene.start('achievements-scene')
    })

    this.tweens.add({
      targets: container,
      x: targetX,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.toastTimer = this.time.delayedCall(2400, () => {
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
