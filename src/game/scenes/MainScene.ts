import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { TouchControls } from '../entities/TouchControls'
import { WORLD, PLATFORMS, BOSS_SHIP, BOSSES, ENEMY, FONT_FAMILY, PLAYER, SHIELD, ENDLESS_SCROLL } from '../config/constants'
import { AchievementManager } from '../achievements/AchievementManager'
import { CoinManager } from '../utils/CoinManager'
import { addCoinCounter, showFloatingPopup } from '../utils/uiHelpers'
import { rotatedVelocity } from '../utils/mathHelpers'
import { showIconToast } from '../utils/toastHelpers'
import { TutorialOverlay } from '../utils/TutorialOverlay'
import { EquipManager } from '../utils/EquipManager'
import { PlayerLoadout } from '../items/PlayerLoadout'
import { playSfx } from '../utils/AudioManager'
import { storageGet, storageSet } from '../utils/storage'
import { promptForName } from '../utils/NameEntryModal'
import { isConfigured, startRun, submitScore } from '../utils/Leaderboard'
import { t } from '../lang'

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
  private newlyUnlockedThisRun!: { iconKey: string; id: string }[]
  private toastQueue!: { iconKey: string }[]
  private toastActive!: boolean
  private bgTile!: Phaser.GameObjects.TileSprite
  private activeBossIdx: number = -1
  private bossesDefeated: Set<number> = new Set()
  private nextBossArenaIdx: number = 0
  private mothershipSprite: Phaser.GameObjects.Sprite | null = null
  private mothershipFrameTimer: number = 0
  private mothershipFrame: number = 0
  private bossDeathAnimating: boolean = false
  private currentLockedPlatforms: Phaser.Physics.Arcade.Image[] = []
  private bossVitals: Array<{ screenX: number; screenY: number; hit: boolean; circle: Phaser.GameObjects.Arc }> = []
  private bossVitalArrows: Phaser.GameObjects.Graphics[] = []
  private playerPlatformVelX: number = 0
  private mothershipTraps!: Phaser.Physics.Arcade.Group
  private mothershipThrowTimer: number = 0
  private lastCoinWorldY!: number
  private coinCountText!: Phaser.GameObjects.Text
  private shieldHUD: Phaser.GameObjects.Text | null = null
  private wingsHUD: Phaser.GameObjects.Text | null = null
  private tutorialOverlay: TutorialOverlay | null = null
  private tutorialActive: boolean = false
  // Read by TutorialOverlay's last step: set when the player destroys a Pera
  // projectile with a shot during the tutorial.
  tutorialTrapHit: boolean = false
  private collectibleCoins!: Phaser.Physics.Arcade.Group
  private platformSpawnCount: number = 0
  private gameMode: 'normal' | 'semFim' = 'normal'
  private startStage: number = 0

  constructor() {
    super('main-scene')
  }

  init(data: { gameMode?: string; startStage?: number }) {
    this.gameMode = data.gameMode === 'semFim' ? 'semFim' : 'normal'
    this.startStage = data.startStage ?? 0
    // Request a signed run token up front; submitScore() consumes it at the end
    // so the server can vet the score against the run's elapsed time.
    void startRun(this.gameMode)
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
    this.bossDeathAnimating = false
    this.shieldHUD = null
    this.wingsHUD = null
    this.tutorialActive = false
    this.tutorialTrapHit = false
    this.lastPlatformY = WORLD.groundY - WORLD.groundHeight / 2
    this.lastPlatformX = WORLD.width / 2
    this.sessionUnlocked = AchievementManager.getUnlocked()
    this.newlyUnlockedThisRun = []
    this.toastQueue = []
    this.toastActive = false
    this.lastCoinWorldY = WORLD.groundY
    this.platformSpawnCount = 0
    this.bossVitalArrows = []

    const STAGE_HEIGHTS = [0, 1000, 2000]
    const startHeight = STAGE_HEIGHTS[this.startStage] ?? 0
    const targetScrollY = -(startHeight * 10)

    if (this.startStage > 0) {
      this.lastPlatformY = targetScrollY + PLAYER.startY + 120
      this.lastCoinWorldY = targetScrollY + PLAYER.startY + 120
      this.lastPlatformX = WORLD.width / 2
      for (let i = 0; i < this.startStage; i++) this.bossesDefeated.add(i)
      this.nextBossArenaIdx = this.startStage
    }

    this.bgTile = this.add.tileSprite(0, 0, WORLD.width, WORLD.height, 'bg')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0)

    this.physics.world.setBounds(0, -WORLD.boundsExtent, WORLD.width, WORLD.boundsExtent + 50000)

    this.platforms = this.physics.add.staticGroup()
    this.movingPlatforms = this.physics.add.group()
    this.collectibleCoins = this.physics.add.group()

    this.spawnGround()

    if (this.startStage > 0) {
      const startPlatform = this.platforms.create(WORLD.width / 2, this.lastPlatformY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
      this.configurePlatformBody(startPlatform)
    }

    for (let i = 0; i < PLATFORMS.initialCount; i++) {
      this.spawnPlatform()
    }

    // Equip "Segunda chance" before building the player so the tutorial run is
    // protected by the shield (made unbreakable below). Unequipped when done.
    const showTutorial = TutorialOverlay.shouldShow()
    if (showTutorial) EquipManager.equip(SHIELD.itemId)

    this.player = new Player(this)

    if (this.startStage > 0) {
      this.cameras.main.scrollY = targetScrollY
      this.player.gameObject.setPosition(PLAYER.startX, targetScrollY + PLAYER.startY)
    }

    this.enemy = new Enemy(this)
    const activeShotConfig = PlayerLoadout.getActiveShotConfig()
    this.touchControls = new TouchControls(this, () => this.player.requestShot(), activeShotConfig.spriteKey, activeShotConfig.flyFrames[0], activeShotConfig.btnIconSize)

    this.physics.add.collider(this.player.gameObject, this.platforms)
    this.physics.add.overlap(this.player.gameObject, this.collectibleCoins, (_p, coinObj) => {
      const coin = coinObj as Phaser.Physics.Arcade.Image
      if (!coin.active) return
      coin.destroy()
      playSfx(this, 'coin-collected', 0.6)
      const total = CoinManager.add(1)
      this.coinCountText.setText(String(total))
      this.showCoinPopup()
    })
    this.physics.add.collider(this.player.gameObject, this.movingPlatforms, (_playerObj, platformObj) => {
      if (this.player.body.blocked.down) {
        const platBody = (platformObj as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        this.playerPlatformVelX = platBody.velocity.x
      }
    })
    this.mothershipTraps = this.physics.add.group()

    this.physics.add.overlap(this.player.gameObject, this.enemy.trapGroup, (_p, trap) => {
      if (this.player.tryAbsorbHit()) {
        ;(trap as Phaser.Physics.Arcade.Image).destroy()
        return
      }
      playSfx(this, 'punch')
      this.killPlayer()
    })

    this.physics.add.overlap(this.player.gameObject, this.mothershipTraps, (_p, trap) => {
      if (this.player.tryAbsorbHit()) {
        ;(trap as Phaser.Physics.Arcade.Image).destroy()
        return
      }
      playSfx(this, 'punch')
      this.killPlayer()
    })

    this.physics.add.overlap(
      this.player.projectiles,
      this.enemy.trapGroup,
      (_shot, _trap) => {
        const shot = _shot as Phaser.Physics.Arcade.Sprite
        playSfx(this, 'coin-collected', 0.6)
        if (!shot.getData('piercing')) this.playShotImpact(shot)
        ;(_trap as Phaser.Physics.Arcade.Image).destroy()
        this.tutorialTrapHit = true
        this.tryAwardCoin()
      },
    )

    this.physics.add.overlap(
      this.player.projectiles,
      this.mothershipTraps,
      (_shot, _trap) => {
        const shot = _shot as Phaser.Physics.Arcade.Sprite
        playSfx(this, 'coin-collected', 0.6)
        if (!shot.getData('piercing')) this.playShotImpact(shot)
        ;(_trap as Phaser.Physics.Arcade.Image).destroy()
        this.tryAwardCoin()
      },
    )

    const STAGE_START_HEIGHTS = [0, 1000, 2000]
    const initialHeight = STAGE_START_HEIGHTS[this.startStage] ?? 0
    this.scoreText = this.add
      .text(16, 16, t('height', initialHeight), { fontSize: '22px', color: '#ffffff', fontFamily: FONT_FAMILY })
      .setScrollFactor(0)

    // Coin counter — positioned to the left of the pause button (pause btn center = WORLD.width-36)
    this.coinCountText = addCoinCounter(this, WORLD.width - 68, 26)

    if (this.player.isShieldOwned() && !showTutorial) {
      this.shieldHUD = this.add
        .text(16, 44, t('shield_ready'), {
          fontSize: '18px',
          color: '#00ff88',
          fontFamily: FONT_FAMILY,
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setScrollFactor(0)
        .setDepth(20)
    }

    if (this.player.isWingsOwned() && this.player.getWingMaxCooldown() > 0) {
      const wingsHudY = this.shieldHUD ? 68 : 44
      this.wingsHUD = this.add
        .text(16, wingsHudY, t('wings_ready'), {
          fontSize: '18px',
          color: '#00ff88',
          fontFamily: FONT_FAMILY,
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setScrollFactor(0)
        .setDepth(20)
    }

    this.addPauseButton()

    if (showTutorial) {
      this.tutorialActive = true
      this.player.setShieldUnbreakable()
      this.applyTutorialPlatformVisibility(true)
      // Pera stays silent until the final step, then throws so the player can
      // practice destroying a projectile.
      this.enemy.setThrowingEnabled(false)
      this.tutorialOverlay = new TutorialOverlay(this, this.player, () => {
        this.enemy.setThrowingEnabled(true)
      })
    }

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
    const impactAnim = (shot.getData('impactAnim') as string) || 'shot-impact'
    shot.anims.play(impactAnim, true)
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
    zone.on('pointerdown', () => { playSfx(this, 'button-click'); this.pauseGame() })
  }

  private killPlayer(bounceUp = true) {
    if (this.dead) return
    this.dead = true
    playSfx(this, 'laugh')
    this.player.die(() => {
      this.scene.start('game-over-scene', { score: this.score, newAchievements: this.newlyUnlockedThisRun, gameMode: this.gameMode })
    }, bounceUp)
  }

  private pauseGame() {
    if (this.dead) return
    this.scene.pause()
    this.scene.launch('pause-scene')
  }

  private spawnGround() {
    const floorTop = WORLD.groundY - WORLD.groundHeight / 2
    this.add.tileSprite(0, floorTop, WORLD.width, WORLD.height - floorTop, WORLD.floorTextureKey)
      .setOrigin(0, 0)
      .setDepth(1)

    const ground = this.platforms.create(WORLD.width / 2, WORLD.groundY, 'pixel') as Phaser.Physics.Arcade.Image
    ground.setDisplaySize(WORLD.width, WORLD.groundHeight).setAlpha(0).refreshBody()
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
    const minShift = PLATFORMS.width + 20
    const leftMax = this.lastPlatformX - minShift
    const rightMin = this.lastPlatformX + minShift
    const hasLeft = minX < leftMax
    const hasRight = rightMin < maxX
    let x: number
    if (hasLeft && hasRight) {
      x = Math.random() < 0.5 ? Phaser.Math.Between(minX, leftMax) : Phaser.Math.Between(rightMin, maxX)
    } else if (hasLeft) {
      x = Phaser.Math.Between(minX, leftMax)
    } else if (hasRight) {
      x = Phaser.Math.Between(rightMin, maxX)
    } else {
      x = Phaser.Math.Between(minX, maxX)
    }
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
    if (this.tutorialActive) {
      platform.setAlpha(0)
      ;(platform.body as Phaser.Physics.Arcade.StaticBody).enable = false
    }

    this.platformSpawnCount++
    if (!this.tutorialActive && this.platformSpawnCount % 8 === 0) {
      this.spawnCollectibleCoin(x, this.lastPlatformY)
    }

    if (Math.random() < 0.3) {
      const minX2 = Math.max(PLATFORMS.minX + half, x + PLATFORMS.width * 3)
      const maxX2 = PLATFORMS.maxX - half
      if (minX2 < maxX2) {
        const x2 = Phaser.Math.Between(minX2, maxX2)
        const platform2 = this.platforms.create(x2, this.lastPlatformY, PLATFORMS.textureKey) as Phaser.Physics.Arcade.Image
        this.configurePlatformBody(platform2)
        if (this.tutorialActive) {
          platform2.setAlpha(0)
          ;(platform2.body as Phaser.Physics.Arcade.StaticBody).enable = false
        }
        this.lastPlatformX = x2
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
    if (this.tutorialActive) {
      platform.setAlpha(0)
      body.enable = false
    }
  }

  private spawnCollectibleCoin(x: number, platformY: number) {
    const coinY = platformY - PLATFORMS.height - 4
    const coin = this.collectibleCoins.create(x, coinY, 'shop-coin') as Phaser.Physics.Arcade.Image
    coin.setDisplaySize(22, 22)
    const body = coin.body as Phaser.Physics.Arcade.Body
    body.setSize(22, 22)
    body.allowGravity = false
    body.immovable = true

    this.tweens.add({
      targets: coin,
      y: coinY - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private applyTutorialPlatformVisibility(hide: boolean): void {
    ;(this.platforms.getChildren() as Phaser.Physics.Arcade.Image[]).forEach(p => {
      if (p.y >= WORLD.groundY) return
      if (hide) {
        p.setAlpha(0)
        ;(p.body as Phaser.Physics.Arcade.StaticBody).enable = false
      } else {
        p.setAlpha(1)
        ;(p.body as Phaser.Physics.Arcade.StaticBody).enable = true
      }
    })
    ;(this.movingPlatforms.getChildren() as Phaser.Physics.Arcade.Image[]).forEach(p => {
      p.setAlpha(hide ? 0 : 1)
      ;(p.body as Phaser.Physics.Arcade.Body).enable = !hide
    })
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
    const { vx, vy } = rotatedVelocity(screenOriginX, worldOriginY, px, py, BOSS_SHIP.projectileSpeed, angleOffset)

    const frame = Phaser.Math.Between(0, 3)
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

    if (bossIdx === 0) this.spawnFirstBossArrows(this.bossVitals, shipScreenY)
  }

  private spawnFirstBossArrows(
    vitals: typeof this.bossVitals,
    shipScreenY: number,
  ): void {
    const ARROW_COLOR = 0xffff00
    const TIP_OFFSET = 30
    const HALF_W = 13
    const HEAD_H = 18
    const SHAFT_W = 5
    const SHAFT_H = 20

    this.bossVitalArrows = vitals.map(vital => {
      const x = vital.screenX
      const tipY = shipScreenY + TIP_OFFSET
      const baseY = tipY + HEAD_H

      const g = this.add.graphics()
        .setScrollFactor(0)
        .setDepth(17)
        .setAlpha(0.9)

      g.fillStyle(ARROW_COLOR, 1)
      g.fillTriangle(x, tipY, x - HALF_W, baseY, x + HALF_W, baseY)
      g.fillRect(x - SHAFT_W / 2, baseY, SHAFT_W, SHAFT_H)

      this.tweens.add({
        targets: g,
        alpha: 0.2,
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      return g
    })
  }

  private clearBossVitalArrows(): void {
    this.bossVitalArrows.forEach(a => {
      this.tweens.killTweensOf(a)
      a.destroy()
    })
    this.bossVitalArrows = []
  }

  private checkBossVitalHits() {
    if (this.bossVitals.length === 0 || this.activeBossIdx === -1) return

    const cameraY = this.cameras.main.scrollY
    const hitRadius = 22

    for (const proj of this.player.projectiles.getChildren() as Phaser.Physics.Arcade.Sprite[]) {
      if (!proj.active) continue
      const projBody = proj.body as Phaser.Physics.Arcade.Body
      if (!projBody?.enable) continue
      for (const vital of this.bossVitals) {
        if (vital.hit) continue
        const dx = proj.x - vital.screenX
        const dy = proj.y - (cameraY + vital.screenY)
        if (Math.abs(dx) < hitRadius && Math.abs(dy) < hitRadius) {
          vital.hit = true
          vital.circle.setFillStyle(0x333333).setStrokeStyle(0)
          this.tweens.killTweensOf(vital.circle)
          if (this.bossVitalArrows.length > 0) this.clearBossVitalArrows()
          playSfx(this, 'hit-vital-point', 0.9)
          this.playShotImpact(proj)
          this.tryAwardCoin()
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
      const projBody = proj.body as Phaser.Physics.Arcade.Body
      if (!projBody?.enable) continue
      const dx = proj.x - ex
      const dy = proj.y - (cameraY + ey)
      if (Math.abs(dx) < r && Math.abs(dy) < r) {
        const stunDuration = proj.getData('stunDuration') as number | undefined
        if (stunDuration) this.enemy.applyStun(stunDuration)
        else this.enemy.showHit()
        if (EquipManager.isEquipped('pomodoro-shot')) {
          playSfx(this, 'coin-collected', 0.6)
          const total = CoinManager.add(2)
          this.coinCountText.setText(String(total))
          this.showCoinPopup(2)
        }
        if (!proj.getData('piercing')) this.playShotImpact(proj)
      }
    }
  }

  private defeatBoss() {
    const reward = BOSSES[this.activeBossIdx]?.reward ?? 0
    if (reward > 0) {
      const total = CoinManager.add(reward)
      this.coinCountText.setText(String(total))
      this.showBossRewardPopup(reward)
    }

    this.bossesDefeated.add(this.activeBossIdx)
    this.clearBossVitalArrows()
    this.mothershipTraps.clear(true, true)

    // Bump height by 1 unit so the player crosses the achievement threshold
    // (bosses trigger at 999/1999/2999, achievements unlock at 1000/2000/3000)
    const achievementScrollY = -((BOSSES[this.activeBossIdx].triggerHeight + 1) * 10)
    this.cameras.main.scrollY = Math.min(this.cameras.main.scrollY, achievementScrollY)

    if (this.gameMode === 'normal') {
      if (this.activeBossIdx === 0) {
        storageSet('normalStagesUnlocked', JSON.stringify([0, 1]))
      } else if (this.activeBossIdx === 1) {
        storageSet('normalStagesUnlocked', JSON.stringify([0, 1, 2]))
      } else if (this.activeBossIdx === 2) {
        storageSet('normalModeCompleted', 'true')
      }
    }

    if (this.activeBossIdx === 2) {
      playSfx(this, 'explosion-ship')
      this.defeatFinalBoss()
      return
    }

    this.onBossDefeated()

    if (this.mothershipSprite) {
      const ship = this.mothershipSprite
      const originX = ship.x
      let shakeDir = 1
      const shakeCount = 14
      let shakesDone = 0

      const doShake = () => {
        if (shakesDone >= shakeCount) {
          ship.x = originX
          this.tweens.add({
            targets: ship,
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
          return
        }
        shakesDone++
        shakeDir *= -1
        this.tweens.add({
          targets: ship,
          x: originX + shakeDir * 18,
          duration: 55,
          ease: 'Linear',
          onComplete: doShake,
        })
      }

      doShake()
    }
  }

  private defeatFinalBoss() {
    if (!this.mothershipSprite) return
    const ship = this.mothershipSprite
    this.bossDeathAnimating = true

    const safetyY = this.cameras.main.scrollY + WORLD.height - 60
    const safety = this.platforms.create(WORLD.width / 2, safetyY, 'pixel') as Phaser.Physics.Arcade.Image
    safety.setDisplaySize(WORLD.width, 14).setTint(0x8899aa)
    const safetyBody = safety.body as Phaser.Physics.Arcade.StaticBody
    safetyBody.setSize(WORLD.width, 14)
    safetyBody.checkCollision.down = false
    safety.refreshBody()

    const blinkFrames = [2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3]
    let blinkIdx = 0
    const originX = ship.x

    const shakeTween = this.tweens.add({
      targets: ship,
      x: originX + 10,
      duration: 60,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const doNextBlink = () => {
      if (blinkIdx >= blinkFrames.length) {
        shakeTween.stop()
        ship.x = originX
        ship.setFrame(4)
        this.time.delayedCall(500, () => playSfx(this, 'falling'))
        this.tweens.add({
          targets: ship,
          y: WORLD.height + BOSS_SHIP.displayHeight,
          duration: 1400,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            this.mothershipSprite?.destroy()
            this.mothershipSprite = null
            this.bossVitals.forEach(v => v.circle.destroy())
            this.bossVitals = []
            this.activeBossIdx = -1
            if (this.gameMode === 'semFim') {
              this.onBossDefeated()
              this.bossDeathAnimating = false
              this.enemy.flyBack()
            } else {
              this.showFinalVictoryModal()
            }
          },
        })
        return
      }
      ship.setFrame(blinkFrames[blinkIdx])
      blinkIdx++
      this.time.delayedCall(280, doNextBlink)
    }

    doNextBlink()
  }

  private showFinalVictoryModal() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2
    const panelW = WORLD.width - 40
    const panelH = 280
    const depth = 80

    const overlay = this.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(depth).setAlpha(0)

    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x111122, 1)
      .setStrokeStyle(2, 0xffd700, 1)
      .setScrollFactor(0).setDepth(depth + 1).setAlpha(0)

    const msgText = this.add.text(
      cx, cy - panelH / 2 + 20,
      t('victory_msg'),
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: panelW - 32 },
      },
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth + 2).setAlpha(0)

    const btnY = cy + panelH / 2 - 34
    const btnBg = this.add.rectangle(cx, btnY, 150, 40, 0xffd700, 1)
      .setScrollFactor(0).setDepth(depth + 2).setAlpha(0)
      .setInteractive({ useHandCursor: true })

    const btnTxt = this.add.text(cx, btnY, t('continue'), {
      fontSize: '18px',
      color: '#111111',
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3).setAlpha(0)

    const all = [overlay, panel, msgText, btnBg, btnTxt]

    btnBg.on('pointerover', () => btnBg.setFillStyle(0xffe066))
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xffd700))
    btnBg.on('pointerdown', () => {
      playSfx(this, 'button-click')
      this.tweens.add({
        targets: all,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          all.forEach(o => o.destroy())
          void this.saveVictoryRanking().then(() => this.scene.start('menu-scene'))
        },
      })
    })

    this.tweens.add({
      targets: all,
      alpha: 1,
      duration: 500,
      ease: 'Quad.easeOut',
    })
  }

  /**
   * Persist the finished classic-mode run into the ranking. Mirrors GameOverScene:
   * updates the local high score and, when the run is a new best and the online
   * ranking is reachable, prompts the player for a name and submits the score.
   */
  private async saveVictoryRanking(): Promise<void> {
    // Only the classic (normal) mode has a victory screen worth ranking; the
    // endless mode never reaches showFinalVictoryModal.
    const mode: 'normal' | 'semFim' = this.gameMode === 'semFim' ? 'semFim' : 'normal'
    const highScoreKey = mode === 'semFim' ? 'highScoreSemFim' : 'highScore'

    const rawBest = parseInt(storageGet(highScoreKey) ?? '0', 10)
    const prevBest = isNaN(rawBest) ? 0 : rawBest
    const isNewBest = this.score > prevBest
    if (isNewBest) storageSet(highScoreKey, String(this.score))

    if (isNewBest && this.score > 0 && isConfigured()) {
      const defaultName = storageGet('playerName') ?? ''
      const name = await promptForName(this, defaultName)
      if (name) {
        storageSet('playerName', name)
        void submitScore(name, this.score, mode)
      }
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
      if (!this.bossDeathAnimating) {
        this.mothershipFrameTimer += delta / 1000
        if (this.mothershipFrameTimer >= BOSS_SHIP.frameDuration) {
          this.mothershipFrameTimer = 0
          this.mothershipFrame = this.mothershipFrame === 0 ? 1 : 0
          this.mothershipSprite.setFrame(this.mothershipFrame)
        }
      }

      if (this.activeBossIdx !== -1 && !this.bossDeathAnimating) {
        const boss = BOSSES[this.activeBossIdx]
        this.mothershipThrowTimer += delta / 1000
        if (this.mothershipThrowTimer >= boss.throwInterval) {
          this.mothershipThrowTimer = 0
          this.fireMothershipProjectile(-0.4)
          this.fireMothershipProjectile(0)
          this.fireMothershipProjectile(0.4)
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

      // Force scroll upward in the 50-unit window before each boss trigger
      const bossPushStarts = [950, 1950, 2950]
      for (let i = 0; i < bossPushStarts.length; i++) {
        if (this.score >= bossPushStarts[i] && !this.bossesDefeated.has(i)) {
          this.cameras.main.scrollY -= 80 * (delta / 1000)
          break
        }
      }

      // Endless mode: gradual auto-scroll acceleration past the start height.
      if (this.gameMode === 'semFim' && this.score >= ENDLESS_SCROLL.startHeight) {
        const over = this.score - ENDLESS_SCROLL.startHeight
        const pushSpeed = Math.min(ENDLESS_SCROLL.maxSpeed, over * ENDLESS_SCROLL.ratePerUnit)
        this.cameras.main.scrollY -= pushSpeed * (delta / 1000)
      }
    }

    const scrollDelta = this.cameras.main.scrollY - prevScrollY
    this.bgTile.tilePositionY += scrollDelta * 0.3

    const cameraTop = this.cameras.main.scrollY

    if (!this.bossDeathAnimating) {
      while (this.lastPlatformY > cameraTop - PLATFORMS.spawnAhead) {
        this.spawnPlatform()
      }
    }

    const cameraBottom = cameraTop + WORLD.height
    ;(this.platforms.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((p) => {
      if (p.y > cameraBottom + PLATFORMS.despawnMargin) p.destroy()
    })
    ;(this.collectibleCoins.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((c) => {
      if (c.y > cameraBottom + PLATFORMS.despawnMargin) c.destroy()
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
    this.scoreText.setText(t('height', this.score))

    if (this.shieldHUD) {
      const cd = this.player.getShieldCooldown()
      if (cd > 0) {
        this.shieldHUD.setText(t('shield_cooldown', Math.ceil(cd))).setColor('#ff8800')
      } else {
        this.shieldHUD.setText(t('shield_ready')).setColor('#00ff88')
      }
    }

    if (this.wingsHUD) {
      const cd = this.player.getWingCooldown()
      if (cd > 0) {
        this.wingsHUD.setText(t('wings_cooldown', Math.ceil(cd))).setColor('#ff8800')
      } else {
        this.wingsHUD.setText(t('wings_ready')).setColor('#00ff88')
      }
    }

    if (this.tutorialOverlay) {
      this.tutorialOverlay.update(delta)
      if (this.tutorialOverlay.isDone) {
        this.tutorialActive = false
        this.applyTutorialPlatformVisibility(false)
        this.enemy.setThrowingEnabled(true)
        // Tutorial over: drop the "Segunda chance" so normal (lethal) play resumes.
        this.player.disableShield()
        EquipManager.unequip(SHIELD.itemId)
        this.tutorialOverlay = null
      }
    }

    this.checkAchievements()

    if (this.player.gameObject.y > cameraBottom) {
      playSfx(this, 'falling')
      this.killPlayer(false)
    }
  }

  private tryAwardCoin() {
    const py = this.player.gameObject.y
    if (py >= this.lastCoinWorldY) return
    this.lastCoinWorldY = py
    const total = CoinManager.add(1)
    this.coinCountText.setText(String(total))
    this.showCoinPopup()
  }

  private showBossRewardPopup(amount: number) {
    showFloatingPopup(this, WORLD.width / 2, WORLD.height / 2, 'shop-coin', `+${amount}`, {
      fontSize: '28px', iconSize: 22, yOffset: 60, duration: 1400,
    })
  }

  private showCoinPopup(amount = 1) {
    const screenX = this.player.gameObject.x
    const screenY = this.player.gameObject.y - this.cameras.main.scrollY - 30
    showFloatingPopup(this, screenX, screenY, 'shop-coin', `+${amount}`, {
      yOffset: 40, duration: 900,
    })
  }

  private checkAchievements() {
    const newlyUnlocked = AchievementManager.checkHeight(this.score)
    for (const achievement of newlyUnlocked) {
      this.sessionUnlocked.add(achievement.id)
      this.newlyUnlockedThisRun.push({ iconKey: achievement.unlockedIconKey, id: achievement.id })
      this.toastQueue.push({ iconKey: achievement.unlockedIconKey })
    }
    if (newlyUnlocked.length > 0) {
      playSfx(this, 'unlock', 0.8)
      if (!this.toastActive) this.showNextToast()
    }
  }

  private showNextToast() {
    const next = this.toastQueue.shift()
    if (!next) { this.toastActive = false; return }
    this.toastActive = true
    showIconToast(this, next.iconKey, () => this.showNextToast())
  }
}
