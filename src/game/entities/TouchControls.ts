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
    const leftBtn = this.createButton(scene, 80, y, '◄')
    const rightBtn = this.createButton(scene, 200, y, '►')
    const jumpBtn = this.createButton(scene, WORLD.width - 90, y, '▲')

    this.bind(leftBtn, 'left')
    this.bind(rightBtn, 'right')
    this.bind(jumpBtn, 'jump')
  }

  private createButton(scene: Phaser.Scene, x: number, y: number, icon: string): Phaser.GameObjects.Zone {
    const radius = 46

    // Position the graphics object at (x, y) and draw the circle at local (0, 0)
    // to avoid scroll-factor coordinate issues
    const gfx = scene.add.graphics({ x, y })
    gfx.fillStyle(0x000000, 0.55)
    gfx.fillCircle(0, 0, radius)
    gfx.lineStyle(3, 0xffffff, 0.75)
    gfx.strokeCircle(0, 0, radius)
    gfx.setScrollFactor(0).setDepth(20)

    scene.add
      .text(x, y, icon, { fontSize: '36px', color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(21)

    const zone = scene.add
      .zone(x, y, radius * 2, radius * 2)
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
