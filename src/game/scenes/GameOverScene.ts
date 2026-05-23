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

    const fim = this.add.image(cx - 65, cy - 130, 'gameover-fim').setScale(SCALE).setOrigin(0.5)
    const cat = this.add.image(cx + 65, cy - 150, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)
    const de = this.add.image(cx - 85, cy - 50, 'gameover-de').setScale(SCALE).setOrigin(0.5)
    const jogo = this.add.image(cx + 55, cy - 45, 'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    bob(fim, 10, 1800)
    bob(cat, 8, 2100)
    bob(de, 10, 1600)
    bob(jogo, 9, 2300)

    this.add
      .text(cx, cy + 105, `Altura: ${data.score}`, { fontSize: '26px', color: '#ffffff' })
      .setOrigin(0.5)

    const bestColor = isNewBest ? '#ffd700' : '#aaaaaa'
    const bestLabel = isNewBest ? `Novo recorde: ${highScore}!` : `Recorde: ${highScore}`
    this.add
      .text(cx, cy + 138, bestLabel, { fontSize: '18px', color: bestColor })
      .setOrigin(0.5)

    const btnSize = 80
    const gap = 40

    const btnHome = this.add
      .image(cx - btnSize / 2 - gap / 2, cy + 205, 'btn-home')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    btnHome.on('pointerover', () => btnHome.setAlpha(1))
    btnHome.on('pointerout', () => btnHome.setAlpha(0.85))
    btnHome.on('pointerdown', () => this.scene.start('menu-scene'))

    const btnPlay = this.add
      .image(cx + btnSize / 2 + gap / 2, cy + 205, 'btn-play')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    btnPlay.on('pointerover', () => btnPlay.setAlpha(1))
    btnPlay.on('pointerout', () => btnPlay.setAlpha(0.85))
    btnPlay.on('pointerdown', () => this.scene.start('main-scene'))

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('main-scene')
    })
  }
}
