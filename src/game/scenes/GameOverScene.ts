import Phaser from 'phaser'
import { WORLD } from '../config/constants'

const SCALE = 6

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('game-over-scene')
  }

  create(data: { score: number }) {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    // "FIM" — upper left
    this.add.image(500, cy - 110, 'gameover-fim').setScale(SCALE).setOrigin(0.5)

    // cat — upper right
    this.add.image(790, cy - 130, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)

    // "DE" — lower left
    this.add.image(450, cy + 50, 'gameover-de').setScale(SCALE).setOrigin(0.5)

    // "JOGO" — lower right
    this.add.image(760, cy + 60, 'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    this.add
      .text(cx, cy + 270, `Altura: ${data.score}`, { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5)

    this.add
      .text(cx, cy + 315, 'Pressione qualquer botão para jogar novamente', { fontSize: '18px', color: '#aaaaaa' })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown', () => {
      this.scene.start('main-scene')
    })
    this.input.once('pointerdown', () => {
      this.scene.start('main-scene')
    })
  }
}
