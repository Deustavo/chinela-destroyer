import Phaser from 'phaser'

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super('main-scene')
  }

  create() {
    // chão
    const ground = this.add.rectangle(640, 680, 1280, 80, 0x444444)

    this.physics.add.existing(ground, true)

    // personagem
    this.player = this.add
      .rectangle(200, 400, 50, 80, 0x00ff88) as unknown as Phaser.Physics.Arcade.Sprite

    this.physics.add.existing(this.player)

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    playerBody.setCollideWorldBounds(true)

    // colisão
    this.physics.add.collider(this.player, ground)

    // teclado
    this.cursors = this.input.keyboard!.createCursorKeys()
  }

  update() {
    const speed = 300
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body

    // reset movimento
    playerBody.setVelocityX(0)

    // esquerda
    if (this.cursors.left?.isDown) {
      playerBody.setVelocityX(-speed)
    }

    // direita
    if (this.cursors.right?.isDown) {
      playerBody.setVelocityX(speed)
    }

    // pulo
    if (
      this.cursors.up?.isDown &&
      playerBody.blocked.down
    ) {
      playerBody.setVelocityY(-500)
    }
  }
}