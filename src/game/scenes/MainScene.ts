import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { TouchControls } from '../entities/TouchControls'
import { WORLD, PLATFORMS, BOSS_SHIP } from '../config/constants'
import { AchievementManager } from '../achievements/AchievementManager'
import { ACHIEVEMENTS } from '../achievements/achievements'

export class MainScene extends Phaser.Scene {
  private player!: Player
  private enemy!: Enemy
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private movingPlatforms!: Phaser.Physics.Arcade.Group
  private touchControls!: TouchControls
  private lastPlatformY!: number
  private lastPlatformX!: number
  private score!: number
  private scoreText!: Phaser.GameObjects.Text
  private dead!: boolean
  private onEscKey!: (e: KeyboardEvent) => void
  private sessionUnlocked!: Set<string>
  private newlyUnlockedThisRun!: { iconKey: string; name: string }[]
  private toastQueue!: { iconKey: string }[]
  private toastActive!: boolean
  private bgTile!: Phaser.GameObjects.TileSprite
  private bossFightActive: boolean = false
  private bossDefeated: boolean = false
  private mothershipSprite: Phaser.GameObjects.Sprite | null = null
  private mothershipFrameTimer: number = 0
  private mothershipFrame: number = 0
  private bossArenaSpawned: boolean = false
  private lockedArenaPlatforms: Phaser.Physics.Arcade.Image[] = []

  constructor() {
    super('main-scene')
  }

  create() {
    this.dead = false
    this.score = 0
    this.bossFightActive = false
    this.bossDefeated = false
    this.mothershipSprite = null
    this.mothershipFrameTimer = 0
    this.mothershipFrame = 0
    this.bossArenaSpawned = false
    this.lockedArenaPlatforms = []
    this.lastPlatformY = WORLD.groundY - WORLD.groundHeight / 2
    this.lastPlatformX = WORLD.width / 2
    this.sessionUnlocked = AchievementManager.getUnlocked()
    this.newlyUnlockedThisRun = []
    this.toastQueue = []
    this.toastActive = false

    this.bgTile = this.add.tileSprite(0, 0, WORLD.width, WORLD.height, 'bg')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0)

    this.physics.world.setBounds(0, -WORLD.boundsExtent, WORLD.width, WORLD.boundsExtent + 50000)

    this.platforms = this.physics.add.staticGroup()
    this.movingPlatforms = this.physics.add.group()

    this.spawnGround()

    for (let i = 0; i < PLATFORMS.initialCount; i++) {
      this.spawnPlatform()
    }

    this.player = new Player(this)
    this.enemy = new Enemy(this)
    this.touchControls = new TouchControls(this)

    this.physics.add.collider(this.player.gameObject, this.platforms)
    this.physics.add.collider(this.player.gameObject, this.movingPlatforms)
    this.physics.add.overlap(this.player.gameObject, this.enemy.trapGroup, () => {
      if (!this.dead) {
        this.dead = true
        this.scene.start('game-over-scene', { score: this.score, newAchievements: this.newlyUnlockedThisRun })
      }
    })

    this.scoreText = this.add
      .text(16, 16, 'Altura: 0', { fontSize: '22px', color: '#ffffff', fontFamily: '"Comic Neue", "Comic Sans MS", cursive' })
      .setScrollFactor(0)

    this.addPauseButton()

    this.onEscKey = (e: KeyboardEvent) => { if (e.key === 'Escape') this.pauseGame() }
    window.addEventListener('keydown', this.onEscKey)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.onEscKey))
  }

  private addPauseButton() {
    const x = WORLD.width - 36
    const y = 28
    const size = 52

    this.add
      .image(x, y, 'btn-pause')
      .setDisplaySize(size, size)
      .setScrollFactor(0)
      .setDepth(20)
      .setAlpha(0.85)

    const zone = this.add.zone(x, y, size, size).setScrollFactor(0).setDepth(22).setInteractive()
    zone.on('pointerdown', () => this.pauseGame())
  }

  private pauseGame() {
    if (this.dead) return
    this.scene.pause()
    this.scene.launch('pause-scene')
  }

  private spawnGround() {
    const ground = this.platforms.create(WORLD.width / 2, WORLD.groundY, 'pixel') as Phaser.Physics.Arcade.Image
    ground.setDisplaySize(WORLD.width, WORLD.groundHeight).setTint(WORLD.groundColor).refreshBody()
  }

  private spawnBossArena() {
    const arenaY = -(BOSS_SHIP.triggerHeight * 10 - BOSS_SHIP.arenaScreenY)
    this.lastPlatformY = arenaY
    this.lastPlatformX = WORLD.width / 2

    const gap = 100
    const leftX = WORLD.width / 2 - PLATFORMS.width / 2 - gap / 2
    const rightX = WORLD.width / 2 + PLATFORMS.width / 2 + gap / 2

    const left = this.platforms.create(leftX, arenaY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
    this.configurePlatformBody(left)
    const right = this.platforms.create(rightX, arenaY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
    this.configurePlatformBody(right)
  }

  private spawnPlatform() {
    if (!this.bossArenaSpawned) {
      const gapY = Phaser.Math.Between(PLATFORMS.minGapY, PLATFORMS.maxGapY)
      if (this.lastPlatformY - gapY <= -(BOSS_SHIP.triggerHeight * 10 - BOSS_SHIP.arenaScreenY)) {
        this.bossArenaSpawned = true
        this.spawnBossArena()
        return
      }
    }

    const gapY = Phaser.Math.Between(PLATFORMS.minGapY, PLATFORMS.maxGapY)
    this.lastPlatformY -= gapY

    const half = PLATFORMS.width / 2
    const minX = Math.max(PLATFORMS.minX + half, this.lastPlatformX - PLATFORMS.maxHorizontalReach)
    const maxX = Math.min(PLATFORMS.maxX - half, this.lastPlatformX + PLATFORMS.maxHorizontalReach)
    const x = Phaser.Math.Between(minX, maxX)
    this.lastPlatformX = x

    if (this.bossArenaSpawned && !this.bossDefeated) {
      const platform = this.platforms.create(x, this.lastPlatformY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
      this.configurePlatformBody(platform)
      platform.setAlpha(0)
      ;(platform.body as Phaser.Physics.Arcade.StaticBody).enable = false
      this.lockedArenaPlatforms.push(platform)
      return
    }

    const heightScore = Math.floor(-this.lastPlatformY / 10)
    if (heightScore > 1001 && Math.random() < PLATFORMS.movingChance) {
      this.spawnMovingPlatform(x, this.lastPlatformY)
      return
    }

    const platform = this.platforms.create(x, this.lastPlatformY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
    this.configurePlatformBody(platform)

    if (Math.random() < 0.3) {
      const minX2 = Math.max(PLATFORMS.minX + half, x + PLATFORMS.width + PLATFORMS.width)
      const maxX2 = PLATFORMS.maxX - half
      if (minX2 < maxX2) {
        const x2 = Phaser.Math.Between(minX2, maxX2)
        const platform2 = this.platforms.create(x2, this.lastPlatformY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
        this.configurePlatformBody(platform2)
      }
    }
  }

  public onBossDefeated() {
    this.bossDefeated = true
    for (const p of this.lockedArenaPlatforms) {
      if (p.active) {
        p.setAlpha(1)
        ;(p.body as Phaser.Physics.Arcade.StaticBody).enable = true
      }
    }
    this.lockedArenaPlatforms = []
  }

  private spawnMovingPlatform(x: number, y: number) {
    const platform = this.movingPlatforms.create(x, y, PLATFORMS.movingTextureKey) as Phaser.Physics.Arcade.Image
    const body = platform.body as Phaser.Physics.Arcade.Body
    body.setSize(PLATFORMS.width, PLATFORMS.height)
    body.setOffset(0, PLATFORMS.textureDrawingOffset)
    body.allowGravity = false
    body.immovable = true
    body.checkCollision.down = false
    body.setVelocityX(Math.random() < 0.5 ? PLATFORMS.movingSpeed : -PLATFORMS.movingSpeed)
  }

  private configurePlatformBody(platform: Phaser.Physics.Arcade.Image) {
    const body = platform.body as Phaser.Physics.Arcade.StaticBody
    body.setSize(PLATFORMS.width, PLATFORMS.height, false)
    body.setOffset(0, PLATFORMS.textureDrawingOffset)
    body.checkCollision.down = false
  }

  private triggerBossFight() {
    this.bossFightActive = true
    this.enemy.flyAway(() => {
      this.time.delayedCall(200, () => this.spawnMothership())
    })
  }

  private spawnMothership() {
    const displayH = BOSS_SHIP.displayHeight
    this.mothershipSprite = this.add
      .sprite(WORLD.width / 2, -displayH / 2, BOSS_SHIP.spriteKey)
      .setScrollFactor(0)
      .setDisplaySize(BOSS_SHIP.displayWidth, displayH)
      .setDepth(15)
      .setFrame(0)

    this.tweens.add({
      targets: this.mothershipSprite,
      y: displayH / 2,
      duration: 900,
      ease: 'Cubic.easeOut',
    })
  }

  update(_time: number, delta: number) {
    if (this.dead) return

    if (!this.bossFightActive && this.score >= BOSS_SHIP.triggerHeight) {
      this.triggerBossFight()
    }

    if (this.mothershipSprite) {
      this.mothershipFrameTimer += delta / 1000
      if (this.mothershipFrameTimer >= BOSS_SHIP.frameDuration) {
        this.mothershipFrameTimer = 0
        this.mothershipFrame = this.mothershipFrame === 0 ? 1 : 0
        this.mothershipSprite.setFrame(this.mothershipFrame)
      }
    }

    const prevScrollY = this.cameras.main.scrollY

    if (!this.bossFightActive) {
      const upperThreshold = this.cameras.main.scrollY + WORLD.height * 0.5
      if (this.player.gameObject.y < upperThreshold) {
        this.cameras.main.scrollY = this.player.gameObject.y - WORLD.height * 0.5
      }
    }

    const scrollDelta = this.cameras.main.scrollY - prevScrollY
    this.bgTile.tilePositionY += scrollDelta * 0.3

    const cameraTop = this.cameras.main.scrollY

    while (this.lastPlatformY > cameraTop - PLATFORMS.spawnAhead) {
      this.spawnPlatform()
    }

    const cameraBottom = cameraTop + WORLD.height
    ;(this.platforms.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((p) => {
      if (p.y > cameraBottom + PLATFORMS.despawnMargin) p.destroy()
    })

    const half = PLATFORMS.width / 2
    ;(this.movingPlatforms.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((p) => {
      if (p.y > cameraBottom + PLATFORMS.despawnMargin) { p.destroy(); return }
      const body = p.body as Phaser.Physics.Arcade.Body
      if (p.x <= PLATFORMS.minX + half) {
        body.setVelocityX(Math.abs(body.velocity.x))
      } else if (p.x >= PLATFORMS.maxX - half) {
        body.setVelocityX(-Math.abs(body.velocity.x))
      }
    })

    this.player.update(this.touchControls.state)
    const { x: px, y: py } = this.player.gameObject
    this.enemy.update(delta, this.cameras.main.scrollY, px, py, this.score)

    this.score = Math.floor(-this.cameras.main.scrollY / 10)
    this.scoreText.setText(`Altura: ${this.score}`)

    this.checkAchievements()

    if (this.player.gameObject.y > cameraBottom + 50) {
      this.dead = true
      this.scene.start('game-over-scene', { score: this.score, newAchievements: this.newlyUnlockedThisRun })
    }
  }

  private checkAchievements() {
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      const achievement = ACHIEVEMENTS[i]
      if (!this.sessionUnlocked.has(achievement.id) && this.score >= achievement.heightThreshold) {
        this.sessionUnlocked.add(achievement.id)
        AchievementManager.checkHeight(this.score)
        this.newlyUnlockedThisRun.push({ iconKey: achievement.unlockedIconKey, name: achievement.name })
        this.toastQueue.push({ iconKey: achievement.unlockedIconKey })
        if (!this.toastActive) this.showNextToast()
      }
    }
  }

  private showNextToast() {
    const next = this.toastQueue.shift()
    if (!next) { this.toastActive = false; return }
    this.toastActive = true

    const iconSize = 28
    const padding = 4
    const panelW = iconSize + padding * 2
    const panelH = iconSize + padding
    const finalX = panelW / 2 + 8
    const startX = -(panelW + 10)
    const panelY = 28

    const container = this.add.container(startX, panelY).setScrollFactor(0).setDepth(50)
    const panel = this.add.rectangle(0, 0, panelW, panelH, 0x111111, 0.82).setStrokeStyle(1, 0xffd700)
    const icon = this.add.image(0, 0, next.iconKey).setDisplaySize(iconSize, iconSize)
    container.add([panel, icon])

    this.tweens.add({
      targets: container,
      x: finalX,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: container,
            x: -(panelW + 10),
            duration: 250,
            ease: 'Cubic.easeIn',
            onComplete: () => { container.destroy(); this.showNextToast() },
          })
        })
      },
    })
  }
}
