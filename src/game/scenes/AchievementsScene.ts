import Phaser from 'phaser'
import { WORLD } from '../config/constants'
import { AchievementManager } from '../achievements/AchievementManager'
import type { Achievement } from '../achievements/achievements'

const COLS = 3
const ICON_SIZE = 90
const H_GAP = 24
const V_GAP = 32
const LOCKED_KEY = 'achievement-locked'
const FONT = '"Comic Neue", "Comic Sans MS", cursive'

export class AchievementsScene extends Phaser.Scene {
  private modalObjects: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super('achievements-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const unlocked = AchievementManager.getUnlocked()
    const all = AchievementManager.getAll()

    this.add.image(cx, WORLD.height / 2, 'bg').setDisplaySize(WORLD.width, WORLD.height).setDepth(0)

    const title = this.add
      .text(cx, 60, 'Conquistas', {
        fontSize: '32px',
        color: '#ffd700',
        fontFamily: FONT,
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

    const elements: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [title]

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
      icon.on('pointerdown', () => this.openModal(achievement, isUnlocked))

      const label = this.add
        .text(x, y + ICON_SIZE / 2 + 6, isUnlocked ? achievement.name : '???', {
          fontSize: '13px',
          color: isUnlocked ? '#ffffff' : '#888888',
          fontFamily: FONT,
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
      .text(cx, WORLD.height - 30 , 'Inicio', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    elements.push(backBtn, labelBack)

    backBtn.on('pointerover', () => { backBtn.setAlpha(1); labelBack.setAlpha(1) })
    backBtn.on('pointerout', () => { backBtn.setAlpha(0.85); labelBack.setAlpha(0.85) })
    backBtn.on('pointerdown', () => this.exitTo('menu-scene', elements))

    labelBack.on('pointerover', () => { backBtn.setAlpha(1); labelBack.setAlpha(1) })
    labelBack.on('pointerout', () => { backBtn.setAlpha(0.85); labelBack.setAlpha(0.85) })
    labelBack.on('pointerdown', () => this.exitTo('menu-scene', elements))

    elements.forEach((el, i) => this.dropIn(el, i * 40))
  }

  private openModal(achievement: Achievement, isUnlocked: boolean) {
    this.modalObjects.forEach(o => o.destroy())
    this.modalObjects = []

    const cx = WORLD.width / 2
    const cy = WORLD.height / 2
    const MODAL_W = 260
    const MODAL_H = 280
    const DEPTH = 10

    const overlay = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.6).setDepth(DEPTH).setInteractive()
    overlay.on('pointerdown', () => this.closeModal())

    const panel = this.add.rectangle(cx, cy, MODAL_W, MODAL_H, 0x1a1a2e, 1)
      .setDepth(DEPTH + 1)
      .setStrokeStyle(2, isUnlocked ? 0xffd700 : 0x555555)

    const iconKey = isUnlocked && this.textures.exists(achievement.unlockedIconKey)
      ? achievement.unlockedIconKey
      : 'achievement-locked'

    const icon = this.add.image(cx, cy - 70, iconKey)
      .setDisplaySize(80, 80)
      .setDepth(DEPTH + 2)
      .setAlpha(isUnlocked ? 1 : 0.5)

    const nameText = this.add.text(cx, cy - 10, isUnlocked ? achievement.name : '???', {
      fontSize: '18px',
      color: isUnlocked ? '#ffd700' : '#888888',
      fontFamily: FONT,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: MODAL_W - 24 },
    }).setOrigin(0.5).setDepth(DEPTH + 2)

    const descText = this.add.text(cx, cy + 30, isUnlocked ? achievement.description : 'Conquista bloqueada', {
      fontSize: '13px',
      color: isUnlocked ? '#cccccc' : '#666666',
      fontFamily: FONT,
      align: 'center',
      wordWrap: { width: MODAL_W - 32 },
    }).setOrigin(0.5).setDepth(DEPTH + 2)

    const closeBtn = this.add.text(cx, cy + MODAL_H / 2 - 28, 'Fechar', {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: FONT,
      backgroundColor: '#333355',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true })

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffd700'))
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'))
    closeBtn.on('pointerdown', () => this.closeModal())

    this.modalObjects = [overlay, panel, icon, nameText, descText, closeBtn]

    const targets = [panel, icon, nameText, descText, closeBtn]
    targets.forEach(t => { t.setAlpha(0); t.setScale(0.85) })
    this.tweens.add({ targets, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' })
  }

  private closeModal() {
    const targets = this.modalObjects.filter(o => o !== this.modalObjects[0])
    this.tweens.add({
      targets,
      alpha: 0,
      scale: 0.85,
      duration: 140,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.modalObjects.forEach(o => o.destroy())
        this.modalObjects = []
      },
    })
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
