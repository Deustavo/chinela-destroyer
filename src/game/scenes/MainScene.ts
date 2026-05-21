import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { WORLD, PLATFORMS, SCROLL } from '../config/constants'

export class MainScene extends Phaser.Scene {
  private player!: Player
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private lastPlatformY!: number
  private lastPlatformX!: number
  private scrollSpeed!: number
  private score!: number
  private scoreText!: Phaser.GameObjects.Text
  private dead!: boolean

  constructor() {
    super('main-scene')
  }

  create() {
    this.dead = false
    this.scrollSpeed = SCROLL.initialSpeed
    this.score = 0
    this.lastPlatformY = WORLD.groundY - WORLD.groundHeight / 2
    this.lastPlatformX = WORLD.width / 2

    this.physics.world.setBounds(0, -WORLD.boundsExtent, WORLD.width, WORLD.boundsExtent + 50000)

    this.platforms = this.physics.add.staticGroup()

    this.spawnGround()

    for (let i = 0; i < PLATFORMS.initialCount; i++) {
      this.spawnPlatform()
    }

    this.player = new Player(this)

    this.physics.add.collider(this.player.gameObject, this.platforms)

    this.scoreText = this.add
      .text(16, 16, 'Altura: 0', { fontSize: '22px', color: '#ffffff' })
      .setScrollFactor(0)
  }

  private spawnGround() {
    const ground = this.platforms.create(WORLD.width / 2, WORLD.groundY, 'pixel') as Phaser.Physics.Arcade.Image
    ground.setDisplaySize(WORLD.width, WORLD.groundHeight).setTint(WORLD.groundColor).refreshBody()
  }

  private spawnPlatform() {
    const gapY = Phaser.Math.Between(PLATFORMS.minGapY, PLATFORMS.maxGapY)
    this.lastPlatformY -= gapY

    const half = PLATFORMS.width / 2
    const minX = Math.max(PLATFORMS.minX + half, this.lastPlatformX - PLATFORMS.maxHorizontalReach)
    const maxX = Math.min(PLATFORMS.maxX - half, this.lastPlatformX + PLATFORMS.maxHorizontalReach)
    const x = Phaser.Math.Between(minX, maxX)
    this.lastPlatformX = x

    const platform = this.platforms.create(x, this.lastPlatformY, 'pixel') as Phaser.Physics.Arcade.Image
    platform.setDisplaySize(PLATFORMS.width, PLATFORMS.height).setTint(PLATFORMS.color).refreshBody()
  }

  update(_time: number, delta: number) {
    if (this.dead) return

    const dt = delta / 1000

    this.scrollSpeed = Math.min(this.scrollSpeed + SCROLL.speedIncrement * dt, SCROLL.maxSpeed)
    this.cameras.main.scrollY -= this.scrollSpeed * dt

    const cameraTop = this.cameras.main.scrollY
    while (this.lastPlatformY > cameraTop - PLATFORMS.spawnAhead) {
      this.spawnPlatform()
    }

    const cameraBottom = cameraTop + WORLD.height
    ;(this.platforms.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((p) => {
      if (p.y > cameraBottom + PLATFORMS.despawnMargin) p.destroy()
    })

    this.player.update()

    this.score = Math.floor(-this.cameras.main.scrollY / 10)
    this.scoreText.setText(`Altura: ${this.score}`)

    if (this.player.gameObject.y > cameraBottom + 50) {
      this.dead = true
      this.scene.start('game-over-scene', { score: this.score })
    }
  }
}
