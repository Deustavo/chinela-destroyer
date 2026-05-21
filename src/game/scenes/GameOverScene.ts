import Phaser from 'phaser'
import { WORLD } from '../config/constants'

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('game-over-scene')
  }

  create(data: { score: number }) {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    this.add
      .text(cx, cy - 90, 'GAME OVER', { fontSize: '56px', color: '#ff4444', fontStyle: 'bold' })
      .setOrigin(0.5)

    this.add
      .text(cx, cy, `Altura: ${data.score}`, { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5)

    this.add
      .text(cx, cy + 80, 'Pressione ESPAÇO para jogar novamente', { fontSize: '20px', color: '#aaaaaa' })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('main-scene')
    })
  }
}
