import Phaser from 'phaser'
import { PLAYER, WORLD, SHOT } from '../config/constants'
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
  private scene: Phaser.Scene
  readonly projectiles: Phaser.Physics.Arcade.Group

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

    this.projectiles = scene.physics.add.group({ allowGravity: false })

    this.registerAnimations(scene)
  }

  get gameObject(): Phaser.Physics.Arcade.Sprite {
    return this.sprite
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body
  }

  getShotCooldownRatio(): number {
    return this.shotCooldown / SHOT.cooldown
  }

  requestShot() {
    if (this.shotCooldown > 0) return
    this.shotCooldown = SHOT.cooldown
    this.fireProjectile()
  }

  private fireProjectile() {
    const proj = this.scene.physics.add.image(
      this.sprite.x,
      this.sprite.y - 20,
      SHOT.spriteKey,
    ) as Phaser.Physics.Arcade.Image

    proj.setDisplaySize(SHOT.displaySize, SHOT.displaySize)
    proj.setDepth(10)
    proj.setScrollFactor(1)

    this.projectiles.add(proj)

    const projBody = proj.body as Phaser.Physics.Arcade.Body
    projBody.setAllowGravity(false)
    projBody.setVelocityY(-SHOT.speed)

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
  }

  update(delta: number, touch?: TouchState) {
    this.shotCooldown = Math.max(0, this.shotCooldown - delta / 1000)

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.requestShot()
    }

    const body = this.body
    body.setVelocityX(0)

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

    this.updateAnimation(body)
  }

  private updateAnimation(body: Phaser.Physics.Arcade.Body) {
    const onGround = body.blocked.down
    const movingX = body.velocity.x !== 0
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
