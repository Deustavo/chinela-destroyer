import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'

export interface TouchState {
  left: boolean
  right: boolean
  jump: boolean
}

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

export class TouchControls {
  readonly state: TouchState = { left: false, right: false, jump: false }
  private shotImage: Phaser.GameObjects.Image | null = null
  private cooldownBar: Phaser.GameObjects.Graphics | null = null
  private shotBtnX: number = 0
  private shotBtnY: number = 0
  private readonly shotBtnDisplaySize: number = 140

  constructor(scene: Phaser.Scene, onShot?: () => void, shotSpriteKey?: string, shotSpriteFrame?: number, shotIconSize?: number) {
    const y = WORLD.height - 60

    if (isTouchDevice()) {
      const { zone: leftBtn } = this.createButton(scene, 60, y, 'btn-left', 200)
      const { zone: rightBtn } = this.createButton(scene, 175, y, 'btn-right', 200)
      const { zone: jumpBtn } = this.createButton(scene, WORLD.width - 60, y, 'btn-up', 200)
      this.bind(leftBtn, 'left')
      this.bind(rightBtn, 'right')
      this.bind(jumpBtn, 'jump')
    }

    this.shotBtnX = WORLD.width - 60
    this.shotBtnY = y - 95

    if (shotSpriteKey) {
      const { image: bgImage, zone: shotBtn } = this.createButton(scene, this.shotBtnX, this.shotBtnY, 'btn-shot', this.shotBtnDisplaySize, 0.7)
      bgImage.setVisible(false)
      const iconSize = shotIconSize ?? this.shotBtnDisplaySize * 0.6
      const spriteIcon = scene.add
        .image(this.shotBtnX, this.shotBtnY, shotSpriteKey, shotSpriteFrame ?? 0)
        .setDisplaySize(iconSize, iconSize)
        .setScrollFactor(0)
        .setDepth(21)
        .setAlpha(0.9)
      this.shotImage = spriteIcon
      if (onShot) {
        shotBtn.on('pointerdown', onShot)
      }
    } else {
      const { image: shotImage, zone: shotBtn } = this.createButton(scene, this.shotBtnX, this.shotBtnY, 'btn-shot', this.shotBtnDisplaySize, 0.7)
      this.shotImage = shotImage
      if (onShot) {
        shotBtn.on('pointerdown', onShot)
      }
    }

    this.cooldownBar = scene.add.graphics().setScrollFactor(0).setDepth(23)

    if (!isTouchDevice()) {
      const labelY = this.shotBtnY + this.shotBtnDisplaySize / 2 + 16
      const label = scene.add
        .text(this.shotBtnX, labelY, 'Aperte E ou ENTER\npara atirar', {
          fontSize: '13px',
          color: '#ffff00',
          fontFamily: FONT_FAMILY,
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(23)
        .setAlpha(1)
      // Keep the label fully on-screen (button sits near the right edge)
      label.x = Math.min(this.shotBtnX, WORLD.width - label.width / 2 - 6)

      const tween = scene.tweens.add({
        targets: label,
        y: labelY + 5,
        duration: 500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })

      const hide = () => {
        if (!label.active) return
        tween.stop()
        label.destroy()
      }

      scene.input.keyboard?.once('keydown-E', hide)
      scene.input.keyboard?.once('keydown-ENTER', hide)
    }
  }

  update(cooldownRatio: number) {
    if (!this.shotImage || !this.cooldownBar) return

    const onCooldown = cooldownRatio > 0
    this.shotImage.setAlpha(onCooldown ? 0.3 : 0.7)

    this.cooldownBar.clear()
    if (!onCooldown) return

    const barW = this.shotBtnDisplaySize * 0.7
    const barH = 5
    const barX = this.shotBtnX - barW / 2
    const barY = this.shotBtnY - this.shotBtnDisplaySize / 3 - barH - 4

    this.cooldownBar.fillStyle(0x000000, 0.6)
    this.cooldownBar.fillRect(barX, barY, barW, barH)

    this.cooldownBar.fillStyle(0x00dd44, 0.9)
    this.cooldownBar.fillRect(barX, barY, barW * (1 - cooldownRatio), barH)
  }

  private createButton(scene: Phaser.Scene, x: number, y: number, textureKey: string, size = 200, alpha = 0.8): { image: Phaser.GameObjects.Image, zone: Phaser.GameObjects.Zone } {
    const image = scene.add
      .image(x, y, textureKey)
      .setDisplaySize(size, size)
      .setScrollFactor(0)
      .setDepth(20)
      .setAlpha(alpha)

    const hitSize = size / 2
    const radius = hitSize * 0.5
    const gfx = scene.add.graphics()
    gfx.fillStyle(0xffffff, 0.15)
    gfx.fillRoundedRect(x - hitSize / 2, y - hitSize / 2, hitSize, hitSize, radius)
    gfx.setScrollFactor(0)
    gfx.setDepth(21)

    const zone = scene.add
      .zone(x, y, hitSize, hitSize)
      .setScrollFactor(0)
      .setDepth(22)
      .setInteractive()

    return { image, zone }
  }

  private bind(zone: Phaser.GameObjects.Zone, key: keyof TouchState) {
    zone.on('pointerdown', () => { this.state[key] = true })
    zone.on('pointerup', () => { this.state[key] = false })
    zone.on('pointerout', () => { this.state[key] = false })
  }
}
