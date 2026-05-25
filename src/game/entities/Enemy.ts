import Phaser from 'phaser'
import { WORLD, ENEMY } from '../config/constants'

export class Enemy {
  private scene: Phaser.Scene
  private sprite: Phaser.GameObjects.Sprite
  private glowSprite: Phaser.GameObjects.Sprite
  private traps: Phaser.Physics.Arcade.Group
  private direction: number = 1
  private frameTimer: number = 0
  private currentFrame: number = 0
  private throwTimer: number = 0
  private bobTimer: number = 0
  private lastCameraScrollY: number = 0
  private lastPlayerX: number = 0
  private lastPlayerY: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.sprite = scene.add.sprite(WORLD.width / 2, ENEMY.screenY, ENEMY.spriteKey)
    this.sprite.setScrollFactor(0)
    this.sprite.setDisplaySize(ENEMY.displayWidth, ENEMY.displayHeight)
    this.sprite.setDepth(10)
    this.sprite.setFrame(0)

    this.glowSprite = scene.add.sprite(WORLD.width / 2, ENEMY.screenY, ENEMY.spriteKey)
    this.glowSprite.setScrollFactor(0)
    this.glowSprite.setDisplaySize(ENEMY.displayWidth, ENEMY.displayHeight)
    this.glowSprite.setDepth(11)
    this.glowSprite.setBlendMode(Phaser.BlendModes.ADD)
    this.glowSprite.setAlpha(0)
    this.glowSprite.setFrame(0)

    this.traps = scene.physics.add.group()
  }

  get trapGroup(): Phaser.Physics.Arcade.Group {
    return this.traps
  }

  update(delta: number, cameraScrollY: number, playerX: number, playerY: number, score: number = 0) {
    const dt = delta / 1000
    this.lastCameraScrollY = cameraScrollY
    this.lastPlayerX = playerX
    this.lastPlayerY = playerY

    this.sprite.x += ENEMY.speed * this.direction * dt
    if (this.sprite.x >= WORLD.width - ENEMY.displayWidth / 2) {
      this.sprite.x = WORLD.width - ENEMY.displayWidth / 2
      this.direction = -1
    } else if (this.sprite.x <= ENEMY.displayWidth / 2) {
      this.sprite.x = ENEMY.displayWidth / 2
      this.direction = 1
    }

    this.sprite.setFlipX(this.direction < 0)
    this.glowSprite.x = this.sprite.x
    this.glowSprite.y = this.sprite.y
    this.glowSprite.setFlipX(this.direction < 0)

    this.bobTimer += dt
    const bob = Math.sin(this.bobTimer * ENEMY.bobSpeed * Math.PI * 2) * ENEMY.bobAmplitude
    this.sprite.y = ENEMY.screenY + bob

    this.frameTimer += dt
    if (this.frameTimer >= ENEMY.frameDuration) {
      this.frameTimer = 0
      this.currentFrame = this.currentFrame === 0 ? 1 : 0
      this.sprite.setFrame(this.currentFrame)
      this.glowSprite.setFrame(this.currentFrame)
    }

    this.throwTimer += dt
    if (this.throwTimer >= ENEMY.throwInterval) {
      this.throwTimer = 0
      this.glowSprite.setAlpha(0)
      if (score >= 1900) {
        this.throwTrap(cameraScrollY, playerX, playerY, -0.5)
        this.scene.time.delayedCall(300, () => {
          this.throwTrap(this.lastCameraScrollY, this.lastPlayerX, this.lastPlayerY, 0)
        })
        this.scene.time.delayedCall(600, () => {
          this.throwTrap(this.lastCameraScrollY, this.lastPlayerX, this.lastPlayerY, 0.5)
        })
      } else if (score >= 500) {
        this.throwTrap(cameraScrollY, playerX, playerY, 0)
        this.scene.time.delayedCall(300, () => {
          this.throwTrap(this.lastCameraScrollY, this.lastPlayerX, this.lastPlayerY, 0.5)
        })
      } else {
        this.throwTrap(cameraScrollY, playerX, playerY, 0)
      }
    }

    const timeLeft = ENEMY.throwInterval - this.throwTimer
    if (timeLeft <= ENEMY.blinkWindow) {
      const progress = (ENEMY.blinkWindow - timeLeft) / ENEMY.blinkWindow
      const alpha = Math.abs(Math.sin(progress * ENEMY.blinkCount * Math.PI)) * 0.8
      this.glowSprite.setAlpha(alpha)
    } else {
      this.glowSprite.setAlpha(0)
    }

    const cameraBottom = cameraScrollY + WORLD.height
    ;(this.traps.getChildren() as Phaser.Physics.Arcade.Image[]).forEach((trap) => {
      if (trap.y > cameraBottom + 200) trap.destroy()
    })
  }

  flyAway(onComplete?: () => void) {
    this.scene.tweens.add({
      targets: [this.sprite, this.glowSprite],
      y: -120,
      duration: 700,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.sprite.setVisible(false)
        this.glowSprite.setVisible(false)
        onComplete?.()
      },
    })
  }

  flyBack() {
    this.sprite.y = -120
    this.glowSprite.y = -120
    this.sprite.setVisible(true)
    this.glowSprite.setVisible(true)
    this.throwTimer = 0
    this.scene.tweens.add({
      targets: [this.sprite, this.glowSprite],
      y: ENEMY.screenY,
      duration: 700,
      ease: 'Cubic.easeOut',
    })
  }

  private throwTrap(cameraScrollY: number, playerX: number, playerY: number, angleOffset: number = 0) {
    const worldX = this.sprite.x
    const worldY = cameraScrollY + this.sprite.y + ENEMY.displayHeight / 2

    const dx = playerX - worldX
    const dy = playerY - worldY
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const cos = Math.cos(angleOffset)
    const sin = Math.sin(angleOffset)
    const vx = ((dx / len) * cos - (dy / len) * sin) * ENEMY.projectileSpeed
    const vy = ((dx / len) * sin + (dy / len) * cos) * ENEMY.projectileSpeed

    const trapFrame = Phaser.Math.Between(0, 2)
    const trap = this.traps.create(worldX, worldY, ENEMY.trapsKey, trapFrame) as Phaser.Physics.Arcade.Image
    trap.setDisplaySize(ENEMY.trapDisplaySize, ENEMY.trapDisplaySize)
    ;(trap.body as Phaser.Physics.Arcade.Body).setSize(ENEMY.trapHitboxSize, ENEMY.trapHitboxSize)
    trap.setVelocityX(vx)
    trap.setVelocityY(vy)
;(trap.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
  }
}
