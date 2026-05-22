import Phaser from 'phaser'
import { PLAYER, WORLD } from '../config/constants'
import type { PlayerAnim } from '../types/animations'

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd: {
    up: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.physics.add.sprite(PLAYER.startX, PLAYER.startY, PLAYER.spriteKey)
    this.sprite.setScale(2 / 3)

    const body = this.body
    body.setCollideWorldBounds(false)
    body.setSize(this.sprite.width, this.sprite.height / 2)
    body.setOffset(0, this.sprite.height / 2)

    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }

    this.registerAnimations(scene)
  }

  get gameObject(): Phaser.Physics.Arcade.Sprite {
    return this.sprite
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body
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

  update() {
    const body = this.body
    body.setVelocityX(0)

    if (this.sprite.x < 0) this.sprite.x = WORLD.width
    else if (this.sprite.x > WORLD.width) this.sprite.x = 0

    if (this.cursors.left?.isDown || this.wasd.left.isDown) {
      body.setVelocityX(-PLAYER.speed)
      this.sprite.setFlipX(true)
    }

    if (this.cursors.right?.isDown || this.wasd.right.isDown) {
      body.setVelocityX(PLAYER.speed)
      this.sprite.setFlipX(false)
    }

    if ((this.cursors.up?.isDown || this.wasd.up.isDown) && body.blocked.down) {
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
