import Phaser from 'phaser'
import { WORLD } from '../config/constants'
import { AchievementManager } from '../achievements/AchievementManager'

const COLS = 3
const ICON_SIZE = 90
const H_GAP = 24
const V_GAP = 32
const LOCKED_KEY = 'achievement-locked'
const FONT = '"Comic Neue", "Comic Sans MS", cursive'

export class AchievementsScene extends Phaser.Scene {
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
