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

  constructor(scene: Phaser.Scene) {
    if (!isTouchDevice()) return

    const y = WORLD.height - 70
    const leftBtn = this.createButton(scene, 80, y, 'btn-left')
    const rightBtn = this.createButton(scene, 200, y, 'btn-right')
    const jumpBtn = this.createButton(scene, WORLD.width - 90, y, 'btn-up')

    this.bind(leftBtn, 'left')
    this.bind(rightBtn, 'right')
    this.bind(jumpBtn, 'jump')
  }

  private createButton(scene: Phaser.Scene, x: number, y: number, textureKey: string): Phaser.GameObjects.Zone {
    const size = 180

    scene.add
      .image(x, y, textureKey)
      .setDisplaySize(size, size)
      .setScrollFactor(0)
      .setDepth(20)
      .setAlpha(0.8)

    const zone = scene.add
      .zone(x, y, size, size)
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
