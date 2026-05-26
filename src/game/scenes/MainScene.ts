import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { TouchControls } from '../entities/TouchControls'
import { WORLD, PLATFORMS, BOSS_SHIP, BOSSES, ENEMY } from '../config/constants'
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
  private activeBossIdx: number = -1
  private bossesDefeated: Set<number> = new Set()
  private nextBossArenaIdx: number = 0
  private mothershipSprite: Phaser.GameObjects.Sprite | null = null
  private mothershipFrameTimer: number = 0
  private mothershipFrame: number = 0
  private currentLockedPlatforms: Phaser.Physics.Arcade.Image[] = []
  private bossVitals: Array<{ screenX: number; screenY: number; hit: boolean; circle: Phaser.GameObjects.Arc }> = []
  private playerPlatformVelX: number = 0
  private mothershipTraps!: Phaser.Physics.Arcade.Group
  private mothershipThrowTimer: number = 0

  constructor() {
    super('main-scene')
  }

  create() {
    this.dead = false
    this.score = 0
    this.activeBossIdx = -1
    this.bossesDefeated = new Set()
    this.nextBossArenaIdx = 0
    this.currentLockedPlatforms = []
    this.mothershipSprite = null
    this.mothershipFrameTimer = 0
    this.mothershipFrame = 0
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
    this.touchControls = new TouchControls(this, () => this.player.requestShot())

    this.physics.add.collider(this.player.gameObject, this.platforms)
    this.physics.add.collider(this.player.gameObject, this.movingPlatforms, (_playerObj, platformObj) => {
      if (this.player.body.blocked.down) {
        const platBody = (platformObj as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        this.playerPlatformVelX = platBody.velocity.x
      }
    })
    this.mothershipTraps = this.physics.add.group()

    this.physics.add.overlap(this.player.gameObject, this.enemy.trapGroup, () => {
      if (!this.dead) {
        this.dead = true
        this.scene.start('game-over-scene', { score: this.score, newAchievements: this.newlyUnlockedThisRun })
      }
    })

    this.physics.add.overlap(this.player.gameObject, this.mothershipTraps, () => {
      if (!this.dead) {
        this.dead = true
        this.scene.start('game-over-scene', { score: this.score, newAchievements: this.newlyUnlockedThisRun })
      }
    })

    this.physics.add.overlap(
      this.player.projectiles,
      this.enemy.trapGroup,
      (_shot, _trap) => {
        this.playShotImpact(_shot as Phaser.Physics.Arcade.Sprite)
        ;(_trap as Phaser.Physics.Arcade.Image).destroy()
      },
    )

    this.physics.add.overlap(
      this.player.projectiles,
      this.mothershipTraps,
      (_shot, _trap) => {
        this.playShotImpact(_shot as Phaser.Physics.Arcade.Sprite)
        ;(_trap as Phaser.Physics.Arcade.Image).destroy()
      },
    )

    this.scoreText = this.add
      .text(16, 16, 'Altura: 0', { fontSize: '22px', color: '#ffffff', fontFamily: '"Comic Neue", "Comic Sans MS", cursive' })
      .setScrollFactor(0)

    this.addPauseButton()

    this.onEscKey = (e: KeyboardEvent) => { if (e.key === 'Escape') this.pauseGame() }
    window.addEventListener('keydown', this.onEscKey)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.onEscKey))
  }

  private playShotImpact(shot: Phaser.Physics.Arcade.Sprite) {
    if (!shot.active) return
    const body = shot.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      body.setVelocity(0, 0)
      body.enable = false
    }
    shot.anims.play('shot-impact', true)
    shot.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      shot.destroy()
    })
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

  private spawnBossArenaFor(bossIdx: number) {
    const arenaY = -(BOSSES[bossIdx].triggerHeight * 10 - BOSS_SHIP.arenaScreenY)
    this.lastPlatformY = arenaY
    this.lastPlatformX = WORLD.width / 2

    if (BOSSES[bossIdx].arenaType === 'moving') {
      this.spawnMovingPlatform(WORLD.width / 2, arenaY)
    } else {
      const gap = 100
      const leftX = WORLD.width / 2 - PLATFORMS.width / 2 - gap / 2
      const rightX = WORLD.width / 2 + PLATFORMS.width / 2 + gap / 2
      const left = this.platforms.create(leftX, arenaY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
      this.configurePlatformBody(left)
      const right = this.platforms.create(rightX, arenaY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
      this.configurePlatformBody(right)
    }
  }

  private spawnPlatform() {
    if (this.nextBossArenaIdx < BOSSES.length) {
      const arenaY = -(BOSSES[this.nextBossArenaIdx].triggerHeight * 10 - BOSS_SHIP.arenaScreenY)
      const gapY = Phaser.Math.Between(PLATFORMS.minGapY, PLATFORMS.maxGapY)
      if (this.lastPlatformY - gapY <= arenaY) {
        this.spawnBossArenaFor(this.nextBossArenaIdx)
        this.nextBossArenaIdx++
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

    const lastArenaIdx = this.nextBossArenaIdx - 1
    if (lastArenaIdx >= 0 && !this.bossesDefeated.has(lastArenaIdx)) {
      const platform = this.platforms.create(x, this.lastPlatformY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
      this.configurePlatformBody(platform)
      platform.setAlpha(0)
      ;(platform.body as Phaser.Physics.Arcade.StaticBody).enable = false
      this.currentLockedPlatforms.push(platform)
      return
    }

    const heightScore = Math.floor(-this.lastPlatformY / 10)
    if (heightScore >= 2900 && heightScore <= 3000) {
      this.spawnMovingPlatform(x, this.lastPlatformY)
      return
    }
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
    for (const p of this.currentLockedPlatforms) {
      if (p.active) {
        p.setAlpha(1)
        ;(p.body as Phaser.Physics.Arcade.StaticBody).enable = true
      }
    }
    this.currentLockedPlatforms = []
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

  private triggerBossFight(bossIdx: number) {
    this.activeBossIdx = bossIdx
    this.enemy.flyAway(() => {
      this.time.delayedCall(200, () => this.spawnMothership(bossIdx))
    })
  }

  private spawnMothership(bossIdx: number) {
    const displayH = BOSS_SHIP.displayHeight
    this.mothershipThrowTimer = 0
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
      onComplete: () => this.spawnBossVitals(bossIdx, displayH / 2),
    })
  }

  private fireMothershipProjectile(angleOffset: number = 0) {
    if (!this.mothershipSprite) return
    const displayH = BOSS_SHIP.displayHeight
    const screenOriginX = this.mothershipSprite.x
    const screenOriginY = displayH
    const worldOriginY = this.cameras.main.scrollY + screenOriginY

    const { x: px, y: py } = this.player.gameObject
    const dx = px - screenOriginX
    const dy = py - worldOriginY
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const cos = Math.cos(angleOffset)
    const sin = Math.sin(angleOffset)
    const vx = ((dx / len) * cos - (dy / len) * sin) * BOSS_SHIP.projectileSpeed
    const vy = ((dx / len) * sin + (dy / len) * cos) * BOSS_SHIP.projectileSpeed

    const frame = Phaser.Math.Between(0, 2)
    const trap = this.mothershipTraps.create(screenOriginX, worldOriginY, ENEMY.trapsKey, frame) as Phaser.Physics.Arcade.Image
    trap.setDisplaySize(ENEMY.trapDisplaySize, ENEMY.trapDisplaySize)
    ;(trap.body as Phaser.Physics.Arcade.Body).setSize(ENEMY.trapHitboxSize, ENEMY.trapHitboxSize)
    ;(trap.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    trap.setVelocityX(vx)
    trap.setVelocityY(vy)
  }

  private spawnBossVitals(bossIdx: number, shipScreenY: number) {
    const count = BOSSES[bossIdx].vitalsCount
    const margin = 55
    const usable = BOSS_SHIP.displayWidth - margin * 2
    const xs = Array.from({ length: count }, (_, i) => margin + (usable / (count - 1)) * i)
    this.bossVitals = xs.map(screenX => {
      const circle = this.add.arc(screenX, shipScreenY, 14, 0, 360, false, 0xff2222)
        .setScrollFactor(0)
        .setDepth(16)
        .setStrokeStyle(2, 0xff8888)

      this.tweens.add({
        targets: circle,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      return { screenX, screenY: shipScreenY, hit: false, circle }
    })
  }

  private checkBossVitalHits() {
    if (this.bossVitals.length === 0 || this.activeBossIdx === -1) return

    const cameraY = this.cameras.main.scrollY
    const hitRadius = 22

    for (const proj of this.player.projectiles.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!proj.active) continue
      for (const vital of this.bossVitals) {
        if (vital.hit) continue
        const dx = proj.x - vital.screenX
        const dy = proj.y - (cameraY + vital.screenY)
        if (Math.abs(dx) < hitRadius && Math.abs(dy) < hitRadius) {
          vital.hit = true
          vital.circle.setFillStyle(0x333333).setStrokeStyle(0)
          this.tweens.killTweensOf(vital.circle)
          this.playShotImpact(proj)
          if (this.bossVitals.every(v => v.hit)) this.defeatBoss()
          break
        }
      }
    }
  }

  private checkEnemyHits() {
    if (!this.enemy.isVisibleTarget) return
    const cameraY = this.cameras.main.scrollY
    const ex = this.enemy.screenX
    const ey = this.enemy.screenY
    const r = ENEMY.hitRadius

    for (const proj of this.player.projectiles.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!proj.active) continue
      const dx = proj.x - ex
      const dy = proj.y - (cameraY + ey)
      if (Math.abs(dx) < r && Math.abs(dy) < r) {
        this.enemy.showHit()
        this.playShotImpact(proj)
      }
    }
  }

  private defeatBoss() {
    this.bossesDefeated.add(this.activeBossIdx)
    this.onBossDefeated()
    this.mothershipTraps.clear(true, true)
    if (this.mothershipSprite) {
      this.tweens.add({
        targets: this.mothershipSprite,
        y: -BOSS_SHIP.displayHeight,
        duration: 800,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.mothershipSprite?.destroy()
          this.mothershipSprite = null
          this.bossVitals.forEach(v => v.circle.destroy())
          this.bossVitals = []
          this.activeBossIdx = -1
          this.enemy.flyBack()
        },
      })
    }
  }

  update(_time: number, delta: number) {
    if (this.dead) return

    if (this.activeBossIdx === -1) {
      for (let i = 0; i < BOSSES.length; i++) {
        if (!this.bossesDefeated.has(i) && this.score >= BOSSES[i].triggerHeight) {
          this.triggerBossFight(i)
          break
        }
      }
    }

    if (this.mothershipSprite) {
      this.mothershipFrameTimer += delta / 1000
      if (this.mothershipFrameTimer >= BOSS_SHIP.frameDuration) {
        this.mothershipFrameTimer = 0
        this.mothershipFrame = this.mothershipFrame === 0 ? 1 : 0
        this.mothershipSprite.setFrame(this.mothershipFrame)
      }

      if (this.activeBossIdx !== -1) {
        const boss = BOSSES[this.activeBossIdx]
        this.mothershipThrowTimer += delta / 1000
        if (this.mothershipThrowTimer >= boss.throwInterval) {
          this.mothershipThrowTimer = 0
          if (boss.projectileCount === 2) {
            this.fireMothershipProjectile(-0.3)
            this.fireMothershipProjectile(0.3)
          } else {
            this.fireMothershipProjectile(-0.4)
            this.fireMothershipProjectile(0)
            this.fireMothershipProjectile(0.4)
          }
        }
      }

      const cameraBottom = this.cameras.main.scrollY + WORLD.height
      ;(this.mothershipTraps.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((trap) => {
        if (trap.y > cameraBottom + 200) trap.destroy()
      })
    }

    const prevScrollY = this.cameras.main.scrollY

    if (this.activeBossIdx === -1) {
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

    this.player.update(delta, this.touchControls.state, this.playerPlatformVelX)
    this.playerPlatformVelX = 0
    this.touchControls.update(this.player.getShotCooldownRatio())
    this.checkBossVitalHits()
    this.checkEnemyHits()
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
