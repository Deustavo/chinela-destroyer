import Phaser from 'phaser'

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super('main-scene')
  }

  preload() {
    this.load.spritesheet('chinela', '/assets/player/chinela.png', {
      frameWidth: 64,
      frameHeight: 64,
    })
  }

  create() {
    // chão
    const ground = this.add.rectangle(640, 680, 1280, 80, 0x444444)

    this.physics.add.existing(ground, true)

    // personagem
    this.player = this.physics.add.sprite(200, 400, 'chinela')

    this.physics.add.existing(this.player)

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    playerBody.setCollideWorldBounds(true)

    // colisão
    this.physics.add.collider(this.player, ground)

    // teclado
    this.cursors = this.input.keyboard!.createCursorKeys()

    // animações
    // frames: 0=parado, 1=levantando, 2=andando1, 3=andando2, 4=andando3, 5=pulando1, 6=pulando2
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('chinela', { frames: [0] }),
      frameRate: 1,
      repeat: -1,
    })

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('chinela', { frames: [2, 3, 4] }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'jump-up',
      frames: this.anims.generateFrameNumbers('chinela', { frames: [5] }),
      frameRate: 1,
      repeat: 0,
    })

    this.anims.create({
      key: 'jump-down',
      frames: this.anims.generateFrameNumbers('chinela', { frames: [6] }),
      frameRate: 1,
      repeat: 0,
    })
  }

  update() {
    const speed = 300
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body

    // reset movimento
    playerBody.setVelocityX(0)

    // esquerda
    if (this.cursors.left?.isDown) {
      playerBody.setVelocityX(-speed)
      this.player.setFlipX(true)
    }

    // direita
    if (this.cursors.right?.isDown) {
      playerBody.setVelocityX(speed)
      this.player.setFlipX(false)
    }

    // pulo
    if (this.cursors.up?.isDown && playerBody.blocked.down) {
      playerBody.setVelocityY(-500)
    }

    // animação baseada no estado
    const onGround = playerBody.blocked.down
    const movingX = playerBody.velocity.x !== 0
    const goingUp = playerBody.velocity.y < 0

    if (!onGround) {
      this.player.anims.play(goingUp ? 'jump-up' : 'jump-down', true)
    } else if (movingX) {
      this.player.anims.play('walk', true)
    } else {
      this.player.anims.play('idle', true)
    }
  }
}