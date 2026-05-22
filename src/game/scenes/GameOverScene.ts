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

    const bob = (img: Phaser.GameObjects.Image, amplitude: number, duration: number) => {
      this.tweens.add({
        targets: img,
        y: img.y + amplitude,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    const fim = this.add.image(500, cy - 110, 'gameover-fim').setScale(SCALE).setOrigin(0.5)
    const cat = this.add.image(790, cy - 130, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)
    const de = this.add.image(450, cy + 50, 'gameover-de').setScale(SCALE).setOrigin(0.5)
    const jogo = this.add.image(760, cy + 60, 'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    bob(fim, 10, 1800)
    bob(cat, 8, 2100)
    bob(de, 10, 1600)
    bob(jogo, 9, 2300)

    this.add
      .text(cx, cy + 270, `Altura: ${data.score}`, { fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5)

    this.add
      .text(cx, cy + 315, 'Pressione ESPAÇO para jogar novamente', { fontSize: '18px', color: '#aaaaaa' })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('main-scene')
    })
  }
}
