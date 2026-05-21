import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { WORLD } from '../config/constants'

export class MainScene extends Phaser.Scene {
  private player!: Player

  constructor() {
    super('main-scene')
  }

  create() {
    const ground = this.add.rectangle(
      WORLD.groundY,
      WORLD.groundY,
      WORLD.groundWidth,
      WORLD.groundHeight,
      WORLD.groundColor,
    )
    this.physics.add.existing(ground, true)

    this.player = new Player(this)

    this.physics.add.collider(this.player.gameObject, ground)
  }

  update() {
    this.player.update()
  }
}
