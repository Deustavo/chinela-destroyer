import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, wireButtonLabel, addCoinCounter, applySceneMuffle } from '../utils/uiHelpers'
import { dropIn, dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { storageGet, storageSet, storageRemove, parseJson } from '../utils/storage'
import { CoinManager } from '../utils/CoinManager'
import { PurchaseManager } from '../utils/PurchaseManager'
import { playSfx } from '../utils/AudioManager'
import { promptForName } from '../utils/NameEntryModal'
import { isConfigured, submitScore, fetchTop, qualifiesForTop50, type GameMode, type ScoreEntry } from '../utils/Leaderboard'
import { t } from '../lang'

const SCALE = 3
const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']

export class GameOverScene extends Phaser.Scene {
  private achievementQueue!: { iconKey: string; id: string }[]
  private toastTimer: Phaser.Time.TimerEvent | null = null
  private destroyed = false

  constructor() {
    super('game-over-scene')
  }

  create(data: { score: number; newAchievements?: { iconKey: string; id: string }[]; gameMode?: string }) {
    this.destroyed = false
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

    // When the online ranking is reachable, the score/record lines move up to make
    // room for a compact "Global" top-3 of the played mode, and the buttons/hint
    // shift down accordingly.
    const showTop3 = isConfigured()

    addBackground(this)
    addCoinCounter(this)
    applySceneMuffle(this)

    const fim  = this.add.image(cx - 65, cy - 160, 'gameover-fim').setScale(SCALE).setOrigin(0.5)
    const cat  = this.add.image(cx + 65, cy - 180, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)
    const de   = this.add.image(cx - 85, cy - 80,  'gameover-de').setScale(SCALE).setOrigin(0.5)
    const jogo = this.add.image(cx + 55, cy - 75,  'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    const labelStyle = { fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY }

    const scoreText = this.add
      .text(cx, cy + (showTop3 ? 40 : 75), t('height', data.score), { fontSize: '26px', color: '#ffffff', fontFamily: FONT_FAMILY })
      .setOrigin(0.5)

    const bestColor = isNewBest ? '#ffd700' : '#aaaaaa'
    const bestLabel = isNewBest ? t('new_record', highScore) : t('record', highScore)
    const bestText = this.add
      .text(cx, cy + (showTop3 ? 70 : 108), bestLabel, { fontSize: '18px', color: bestColor, fontFamily: FONT_FAMILY })
      .setOrigin(0.5)

    const btnY = cy + (showTop3 ? 221 : 150)
    const labelY = btnY + 25
    const hintY = cy + (showTop3 ? 310 : 270)

    const btnSize = 80
    const gap = 40

    const btnHome = this.add
      .image(cx - btnSize / 2 - gap / 2, btnY, 'btn-home')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const btnPlay = this.add
      .image(cx + btnSize / 2 + gap / 2, btnY, 'btn-play')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelHome = this.add
      .text(cx - btnSize / 2 - gap / 2, labelY, t('home'), labelStyle)
      .setOrigin(0.5, 0)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelPlay = this.add
      .text(cx + btnSize / 2 + gap / 2, labelY, t('play_again'), labelStyle)
      .setOrigin(0.5, 0)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const isMobile = this.sys.game.device.input.touch
    const spaceHint = this.add
      .text(cx, hintY, t('space_hint'), { fontSize: '14px', color: '#aaaaaa', fontFamily: FONT_FAMILY })
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

    if (showTop3) this.renderTop3(gameMode, cy + 100, allElements)

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
    // so keys don't fire while the player is typing their name.
    // Qualquer tecla reinicia a partida.
    const wireKeys = () => {
      this.input.keyboard!.once('keydown', playAgain)
    }

    wireButtonLabel(btnHome, labelHome, backToMenu)
    wireButtonLabel(btnPlay, labelPlay, playAgain)

    const canSubmit = isSemFim ? true : isNewBest
    if (data.score > 0 && isConfigured() && canSubmit) {
      this.time.delayedCall(650, () => {
        void qualifiesForTop50(data.score, gameMode).then((qualifies) => {
          if (qualifies) return this.promptAndSubmit(data.score, gameMode).then(wireKeys)
          wireKeys()
        })
      })
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

  /** Render a compact TOP 3 for the played mode below the record line. Fetches async. */
  private renderTop3(mode: GameMode, topY: number, allElements: SceneObject[]) {
    const cx = WORLD.width / 2

    const header = this.add
      .text(cx, topY, t('top3_title'), {
        fontSize: '15px', color: '#ffd700', fontFamily: FONT_FAMILY,
        stroke: '#000000', strokeThickness: 3,
      })
      .setOrigin(0.5)
    allElements.push(header)
    dropIn(this, header, 600)

    fetchTop(mode, 3).then((entries) => {
      if (this.destroyed) return
      const left = cx - 130
      const right = cx + 130

      entries.slice(0, 3).forEach((entry: ScoreEntry, i: number) => {
        const y = topY + 22 + i * 20
        const color = MEDAL_COLORS[i] ?? '#ffffff'

        const rank = this.add
          .text(left, y, `${i + 1}`, { fontSize: '15px', color, fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3 })
          .setOrigin(0, 0.5)
        const name = this.add
          .text(left + 26, y, this.truncateName(entry.name, 150), { fontSize: '15px', color: '#ffffff', fontFamily: FONT_FAMILY })
          .setOrigin(0, 0.5)
        const score = this.add
          .text(right, y, String(entry.score), { fontSize: '15px', color, fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3 })
          .setOrigin(1, 0.5)

        allElements.push(rank, name, score)
        ;[rank, name, score].forEach((o) => {
          o.setAlpha(0)
          o.y = y + 10
          this.tweens.add({ targets: o, alpha: 1, y, duration: 260, delay: i * 60, ease: 'Cubic.easeOut' })
        })
      })
    })
  }

  private truncateName(text: string, maxWidth: number): string {
    const probe = this.add.text(0, 0, text, { fontSize: '15px', fontFamily: FONT_FAMILY }).setVisible(false)
    let result = text
    while (result.length > 1 && probe.width > maxWidth) {
      result = result.slice(0, -1)
      probe.setText(result + '…')
    }
    const final = probe.width > maxWidth || result !== text ? result + '…' : text
    probe.destroy()
    return final
  }

  shutdown() {
    this.destroyed = true
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
