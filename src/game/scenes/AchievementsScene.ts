import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { AchievementManager } from '../achievements/AchievementManager'
import type { Achievement } from '../achievements/achievements'
import { addBackground, addModalOverlay, wireButtonLabel, addCoinCounter, bindEscapeKey, createSecondaryButton, applySceneMuffle } from '../utils/uiHelpers'
import { playSfx } from '../utils/AudioManager'
import { dropIn, exitTo, type SceneObject } from '../utils/sceneTransitions'

const COLS = 3
const ICON_SIZE = 90
const H_GAP = 24
const V_GAP = 32
const LOCKED_KEY = 'achievement-locked'

type Modal = {
  overlay: Phaser.GameObjects.Rectangle
  panel: Phaser.GameObjects.Image
  icon: Phaser.GameObjects.Image
  nameText: Phaser.GameObjects.Text
  descText: Phaser.GameObjects.Text
  closeBtn: Phaser.GameObjects.Container
}

export class AchievementsScene extends Phaser.Scene {
  private modal: Modal | null = null

  constructor() {
    super('achievements-scene')
  }

  private playClick() { playSfx(this, 'button-click') }

  create() {
    const cx = WORLD.width / 2
    const unlocked = AchievementManager.getUnlocked()
    const all = AchievementManager.getAll()

    addBackground(this)
    addCoinCounter(this)
    applySceneMuffle(this)

    const title = this.add
      .text(cx, 60, 'Conquistas', {
        fontSize: '32px',
        color: '#ffd700',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1)

    const totalW = COLS * ICON_SIZE + (COLS - 1) * H_GAP
    const startX = cx - totalW / 2 + ICON_SIZE / 2
    const rows = Math.ceil(all.length / COLS)
    const totalH = rows * (ICON_SIZE + 36) + (rows - 1) * V_GAP
    const startY = WORLD.height / 2 - totalH / 2 + ICON_SIZE / 2 + 20

    const elements: SceneObject[] = [title]

    all.forEach((achievement, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x = startX + col * (ICON_SIZE + H_GAP)
      const y = startY + row * (ICON_SIZE + 36 + V_GAP)

      const isUnlocked = unlocked.has(achievement.id) && this.textures.exists(achievement.unlockedIconKey)
      const iconKey = isUnlocked ? achievement.unlockedIconKey : LOCKED_KEY

      const icon = this.add
        .image(x, y, iconKey)
        .setDisplaySize(ICON_SIZE, ICON_SIZE)
        .setDepth(2)
        .setAlpha(isUnlocked ? 1 : 0.55)
        .setInteractive({ useHandCursor: true })

      icon.on('pointerover', () => icon.setScale(1.12))
      icon.on('pointerout', () => icon.setScale(1))
      icon.on('pointerdown', () => { this.playClick(); this.openModal(achievement, isUnlocked) })

      const label = this.add
        .text(x, y + ICON_SIZE / 2 + 6, isUnlocked ? achievement.name : '???', {
          fontSize: '13px',
          color: isUnlocked ? '#ffffff' : '#888888',
          fontFamily: FONT_FAMILY,
          align: 'center',
          wordWrap: { width: ICON_SIZE + H_GAP - 4 },
        })
        .setOrigin(0.5, 0)
        .setDepth(2)

      elements.push(icon, label)
    })

    const backBtn = this.add
      .image(cx, WORLD.height - 52, 'btn-home')
      .setDisplaySize(64, 64)
      .setDepth(3)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true })

    const labelBack = this.add
      .text(cx, WORLD.height - 30, 'Início', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    elements.push(backBtn, labelBack)

    const goBack = () => { this.playClick(); exitTo(this, 'menu-scene', elements) }
    wireButtonLabel(backBtn, labelBack, goBack)
    bindEscapeKey(this, goBack)

    elements.forEach((el, i) => dropIn(this, el, i * 40))
  }

  private openModal(achievement: Achievement, isUnlocked: boolean) {
    if (this.modal) {
      const { overlay, panel, icon, nameText, descText, closeBtn } = this.modal
      ;[overlay, panel, icon, nameText, descText, closeBtn].forEach(o => o.destroy())
      this.modal = null
    }

    const cx = WORLD.width / 2
    const cy = WORLD.height / 2
    const MODAL_SIZE = 390   // square
    const DEPTH = 10

    const overlay = addModalOverlay(this, DEPTH).setInteractive().setAlpha(0)
    overlay.on('pointerdown', () => { this.playClick(); this.closeModal() })

    const panel = this.add.image(cx, cy, 'modal-bg')
      .setDisplaySize(MODAL_SIZE, MODAL_SIZE)
      .setDepth(DEPTH + 1)
      .setAlpha(0)

    const iconKey = isUnlocked && this.textures.exists(achievement.unlockedIconKey)
      ? achievement.unlockedIconKey
      : 'achievement-locked'

    const icon = this.add.image(cx, cy - 90, iconKey)
      .setDisplaySize(160, 160)
      .setDepth(DEPTH + 2)
      .setAlpha(0)

    const nameText = this.add.text(cx, cy + 20, isUnlocked ? achievement.name : '???', {
      fontSize: '22px',
      color: isUnlocked ? '#ffd700' : '#888888',
      fontFamily: FONT_FAMILY,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: MODAL_SIZE - 40 },
    }).setOrigin(0.5).setDepth(DEPTH + 2)

    const descText = this.add.text(cx, cy + 64, isUnlocked ? achievement.description : 'Conquista bloqueada', {
      fontSize: '15px',
      color: isUnlocked ? '#cccccc' : '#666666',
      fontFamily: FONT_FAMILY,
      align: 'center',
      wordWrap: { width: MODAL_SIZE - 48 },
    }).setOrigin(0.5).setDepth(DEPTH + 2)

    const closeBtn = createSecondaryButton(this, cx, cy + 124, 'Fechar', () => { this.playClick(); this.closeModal() })
      .setDepth(DEPTH + 2)

    this.modal = { overlay, panel, icon, nameText, descText, closeBtn }

    // overlay + panel + icon: alpha-only (setScale would override setDisplaySize in Phaser)
    this.tweens.add({ targets: overlay, alpha: 0.6, duration: 180, ease: 'Cubic.easeOut' })
    this.tweens.add({ targets: [panel, icon], alpha: isUnlocked ? 1 : 0.5, duration: 180, ease: 'Cubic.easeOut' })

    // Scale + alpha tween for text/button only
    const contentTargets = [nameText, descText, closeBtn]
    contentTargets.forEach(t => { t.setAlpha(0); t.setScale(0.85) })
    this.tweens.add({ targets: contentTargets, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' })
  }

  private closeModal() {
    if (!this.modal) return
    const { overlay, panel, icon, nameText, descText, closeBtn } = this.modal

    // overlay + panel + icon: alpha-only (setScale would corrupt setDisplaySize)
    this.tweens.add({ targets: [overlay, panel, icon], alpha: 0, duration: 140, ease: 'Cubic.easeIn' })
    this.tweens.add({
      targets: [nameText, descText, closeBtn],
      alpha: 0,
      scale: 0.85,
      duration: 140,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        ;[overlay, panel, icon, nameText, descText, closeBtn].forEach(o => o.destroy())
        this.modal = null
      },
    })
  }
}
