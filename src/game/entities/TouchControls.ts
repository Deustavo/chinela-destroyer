import Phaser from 'phaser'
import { WORLD } from '../config/constants'

export interface TouchState {
  left: boolean
  right: boolean
  jump: boolean
}

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

export class TouchControls {
  readonly state: TouchState = { left: false, right: false, jump: false }

  constructor(scene: Phaser.Scene, onShot?: () => void) {
    if (!isTouchDevice()) return

    const y = WORLD.height - 45
    const leftBtn = this.createButton(scene, 55, y, 'btn-left', 140)
    const rightBtn = this.createButton(scene, 160, y, 'btn-right', 140)
    const jumpBtn = this.createButton(scene, WORLD.width - 65, y, 'btn-up', 140)
    const shotBtn = this.createButton(scene, WORLD.width - 65, y - 75, 'btn-shot', 80, 0.7)

    this.bind(leftBtn, 'left')
    this.bind(rightBtn, 'right')
    this.bind(jumpBtn, 'jump')

    if (onShot) {
      shotBtn.on('pointerdown', onShot)
    }
  }

  private createButton(scene: Phaser.Scene, x: number, y: number, textureKey: string, size = 180, alpha = 0.8): Phaser.GameObjects.Zone {
    scene.add
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

    return zone
  }

  private bind(zone: Phaser.GameObjects.Zone, key: keyof TouchState) {
    zone.on('pointerdown', () => { this.state[key] = true })
    zone.on('pointerup', () => { this.state[key] = false })
    zone.on('pointerout', () => { this.state[key] = false })
  }
}
