import Phaser from 'phaser'
import { WORLD } from '../config/constants'

const SCALE = 3

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('game-over-scene')
  }

  create(data: { score: number }) {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    const prevBest = parseInt(localStorage.getItem('highScore') ?? '0', 10)
    const isNewBest = data.score > prevBest
    if (isNewBest) localStorage.setItem('highScore', String(data.score))
    const highScore = isNewBest ? data.score : prevBest

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

    const fim = this.add.image(cx - 55, cy - 100, 'gameover-fim').setScale(SCALE).setOrigin(0.5)
    const cat = this.add.image(cx + 55, cy - 120, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)
    const de = this.add.image(cx - 55, cy + 60, 'gameover-de').setScale(SCALE).setOrigin(0.5)
    const jogo = this.add.image(cx + 55, cy + 75, 'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    bob(fim, 10, 1800)
    bob(cat, 8, 2100)
    bob(de, 10, 1600)
    bob(jogo, 9, 2300)

    this.add
      .text(cx, cy + 195, `Altura: ${data.score}`, { fontSize: '26px', color: '#ffffff' })
      .setOrigin(0.5)

    const bestColor = isNewBest ? '#ffd700' : '#aaaaaa'
    const bestLabel = isNewBest ? `Novo recorde: ${highScore}!` : `Recorde: ${highScore}`
    this.add
      .text(cx, cy + 228, bestLabel, { fontSize: '18px', color: bestColor })
      .setOrigin(0.5)

    const isTouch = this.sys.game.device.input.touch
    const restartHint = isTouch
      ? 'Toque para jogar novamente'
      : 'Pressione ESPAÇO para jogar novamente'

    this.add
      .text(cx, cy + 262, restartHint, { fontSize: '16px', color: '#aaaaaa' })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('main-scene')
    })

    this.input.once('pointerdown', () => {
      this.scene.start('main-scene')
    })
  }
}
