import Phaser from 'phaser'
import { PLAYER, WORLD, SHOT, SHIELD } from '../config/constants'
import { ITEM_REGISTRY } from '../items/registry'
import { PlayerLoadout } from '../items/PlayerLoadout'
import { PurchaseManager } from '../utils/PurchaseManager'
import type { ShotConfig } from '../items/types'
import type { PlayerAnim } from '../types/animations'
import type { TouchState } from './TouchControls'

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd: {
    up: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }
  private spaceKey: Phaser.Input.Keyboard.Key
  private shotCooldown: number = 0
  private activeShotConfig: ShotConfig
  private scene: Phaser.Scene
  readonly projectiles: Phaser.Physics.Arcade.Group

  private shieldOwned: boolean = false
  private shieldCooldown: number = 0
  private shieldSprite: Phaser.GameObjects.Image | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.sprite = scene.physics.add.sprite(PLAYER.startX, PLAYER.startY, PLAYER.spriteKey)
    this.sprite.setScale(.5)
    const body = this.body
    body.setCollideWorldBounds(false)
    const hitW = this.sprite.width * 0.5
    body.setSize(hitW, this.sprite.height / 2)
    body.setOffset((this.sprite.width - hitW) / 2, this.sprite.height / 2)

    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.activeShotConfig = PlayerLoadout.getActiveShotConfig()
    this.projectiles = scene.physics.add.group({ allowGravity: false })

    this.shieldOwned = PurchaseManager.has(SHIELD.itemId)
    if (this.shieldOwned) {
      this.shieldSprite = scene.add
        .image(PLAYER.startX, PLAYER.startY, SHIELD.spriteKey, 0)
        .setDisplaySize(SHIELD.displaySize, SHIELD.displaySize)
        .setDepth(6)
        .setAlpha(0.9)
    }

    this.registerAnimations(scene)
  }

  get gameObject(): Phaser.Physics.Arcade.Sprite {
    return this.sprite
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body
  }

  getShotCooldownRatio(): number {
    return this.shotCooldown / this.activeShotConfig.cooldown
  }

  isShieldOwned(): boolean {
    return this.shieldOwned
  }

  getShieldCooldown(): number {
    return this.shieldCooldown
  }

  tryAbsorbHit(): boolean {
    if (!this.shieldOwned || this.shieldCooldown > 0) return false
    this.shieldCooldown = SHIELD.cooldown
    if (this.shieldSprite) {
      this.scene.tweens.add({
        targets: this.shieldSprite,
        scaleX: 1.4,
        scaleY: 1.4,
        alpha: 0.15,
        duration: 180,
        yoyo: true,
        ease: 'Quad.easeOut',
      })
    }
    return true
  }

  requestShot() {
    if (this.shotCooldown > 0) return
    this.shotCooldown = this.activeShotConfig.cooldown
    this.fireProjectile(this.activeShotConfig)
  }

  private fireProjectile(config: ShotConfig) {
    const proj = this.scene.physics.add.sprite(
      this.sprite.x,
      this.sprite.y - 20,
      config.spriteKey,
    ) as Phaser.Physics.Arcade.Sprite

    proj.setDisplaySize(config.displaySize, config.displaySize)
    proj.setDepth(10)
    proj.setScrollFactor(1)
    proj.anims.play(config.flyAnimKey, true)
    proj.setData('impactAnim', config.impactAnimKey)

    this.projectiles.add(proj)

    const projBody = proj.body as Phaser.Physics.Arcade.Body
    projBody.setAllowGravity(false)
    projBody.setVelocityY(-config.speed)

    this.scene.time.delayedCall(3000, () => {
      if (proj.active) proj.destroy()
    })
  }

  private registerAnimations(scene: Phaser.Scene) {
    const { frames, animFrameRates, spriteKey } = PLAYER

    scene.anims.create({
      key: 'idle' satisfies PlayerAnim,
      frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [...frames.idle] }),
      frameRate: animFrameRates.idle,
      repeat: -1,
    })

    scene.anims.create({
      key: 'walk' satisfies PlayerAnim,
      frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [...frames.walk] }),
      frameRate: animFrameRates.walk,
      repeat: -1,
    })

    scene.anims.create({
      key: 'jump-up' satisfies PlayerAnim,
      frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [...frames.jumpUp] }),
      frameRate: animFrameRates.jump,
      repeat: 0,
    })

    scene.anims.create({
      key: 'jump-down' satisfies PlayerAnim,
      frames: scene.anims.generateFrameNumbers(spriteKey, { frames: [...frames.jumpDown] }),
      frameRate: animFrameRates.jump,
      repeat: 0,
    })

    // Base shot (not a registry item — every player has this)
    if (!scene.anims.exists('shot-fly')) {
      scene.anims.create({
        key: 'shot-fly',
        frames: scene.anims.generateFrameNumbers(SHOT.spriteKey, { frames: [...SHOT.flyFrames] }),
        frameRate: SHOT.flyFrameRate,
        repeat: -1,
      })
    }
    if (!scene.anims.exists('shot-impact')) {
      scene.anims.create({
        key: 'shot-impact',
        frames: scene.anims.generateFrameNumbers(SHOT.spriteKey, { frames: [...SHOT.impactFrames] }),
        frameRate: SHOT.impactFrameRate,
        repeat: 0,
      })
    }

    // All registered shot items
    for (const item of ITEM_REGISTRY) {
      if (item.type !== 'shot' || !item.shotConfig) continue
      const cfg = item.shotConfig
      if (!scene.anims.exists(cfg.flyAnimKey)) {
        scene.anims.create({
          key: cfg.flyAnimKey,
          frames: scene.anims.generateFrameNumbers(cfg.spriteKey, { frames: [...cfg.flyFrames] }),
          frameRate: cfg.flyFrameRate,
          repeat: -1,
        })
      }
      if (!scene.anims.exists(cfg.impactAnimKey)) {
        scene.anims.create({
          key: cfg.impactAnimKey,
          frames: scene.anims.generateFrameNumbers(cfg.spriteKey, { frames: [...cfg.impactFrames] }),
          frameRate: cfg.impactFrameRate,
          repeat: 0,
        })
      }
    }
  }

  die(onComplete: () => void) {
    this.body.enable = false

    const driftX = Phaser.Math.Between(-120, 120)

    this.scene.tweens.chain({
      targets: this.sprite,
      tweens: [
        {
          y: this.sprite.y - 60,
          duration: 250,
          ease: 'Quad.easeOut',
        },
        {
          angle: 720,
          y: this.sprite.y + 1200,
          x: this.sprite.x + driftX,
          duration: 1400,
          ease: 'Quad.easeIn',
          onComplete,
        },
      ],
    })
  }

  update(delta: number, touch?: TouchState, platformVelX: number = 0) {
    this.shotCooldown = Math.max(0, this.shotCooldown - delta / 1000)

    if (this.shieldOwned && this.shieldSprite) {
      this.shieldCooldown = Math.max(0, this.shieldCooldown - delta / 1000)
      this.shieldSprite.setPosition(this.sprite.x, this.sprite.y - 4)
      this.shieldSprite.setAlpha(this.shieldCooldown > 0 ? 0.2 : 0.9)
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.requestShot()
    }

    const body = this.body
    body.setVelocityX(platformVelX)

    if (this.sprite.x < 0) this.sprite.x = WORLD.width
    else if (this.sprite.x > WORLD.width) this.sprite.x = 0

    if (this.cursors.left?.isDown || this.wasd.left.isDown || touch?.left) {
      body.setVelocityX(-PLAYER.speed)
      this.sprite.setFlipX(true)
    }

    if (this.cursors.right?.isDown || this.wasd.right.isDown || touch?.right) {
      body.setVelocityX(PLAYER.speed)
      this.sprite.setFlipX(false)
    }

    if ((this.cursors.up?.isDown || this.wasd.up.isDown || touch?.jump) && body.blocked.down) {
      body.setVelocityY(PLAYER.jumpVelocity)
    }

    const multiplier = body.velocity.y > 0
      ? PLAYER.fallGravityMultiplier
      : PLAYER.riseGravityMultiplier
    const extraGravity = WORLD.gravity * (multiplier - 1)
    body.setGravityY(extraGravity)

    const movingX =
      !!(this.cursors.left?.isDown || this.wasd.left.isDown || touch?.left) ||
      !!(this.cursors.right?.isDown || this.wasd.right.isDown || touch?.right)
    this.updateAnimation(body, movingX)
  }

  private updateAnimation(body: Phaser.Physics.Arcade.Body, movingX: boolean) {
    const onGround = body.blocked.down
    const goingUp = body.velocity.y < 0

    let anim: PlayerAnim

    if (!onGround) {
      anim = goingUp ? 'jump-up' : 'jump-down'
    } else if (movingX) {
      anim = 'walk'
    } else {
      anim = 'idle'
    }

    this.sprite.anims.play(anim, true)
  }
}
