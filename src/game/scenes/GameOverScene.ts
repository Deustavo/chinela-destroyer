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

    const fim  = this.add.image(cx - 65, cy - 130, 'gameover-fim').setScale(SCALE).setOrigin(0.5)
    const cat  = this.add.image(cx + 65, cy - 150, 'gameover-chinela').setScale(SCALE).setOrigin(0.5)
    const de   = this.add.image(cx - 85, cy - 50,  'gameover-de').setScale(SCALE).setOrigin(0.5)
    const jogo = this.add.image(cx + 55, cy - 45,  'gameover-jogo').setScale(SCALE).setOrigin(0.5)

    const scoreText = this.add
      .text(cx, cy + 105, `Altura: ${data.score}`, { fontSize: '26px', color: '#ffffff', fontFamily: 'Patrick Hand, cursive' })
      .setOrigin(0.5)

    const bestColor = isNewBest ? '#ffd700' : '#aaaaaa'
    const bestLabel = isNewBest ? `Novo recorde: ${highScore}!` : `Recorde: ${highScore}`
    const bestText = this.add
      .text(cx, cy + 138, bestLabel, { fontSize: '18px', color: bestColor, fontFamily: 'Patrick Hand, cursive' })
      .setOrigin(0.5)

    const btnSize = 80
    const gap = 40

    const btnHome = this.add
      .image(cx - btnSize / 2 - gap / 2, cy + 205, 'btn-home')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const btnPlay = this.add
      .image(cx + btnSize / 2 + gap / 2, cy + 205, 'btn-play')
      .setDisplaySize(btnSize, btnSize)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const allElements = [fim, cat, de, jogo, scoreText, bestText, btnHome, btnPlay]

    this.dropIn(fim,       { amplitude: 10, floatDuration: 1800, delay: 0   })
    this.dropIn(cat,       { amplitude: 8,  floatDuration: 2100, delay: 100 })
    this.dropIn(de,        { amplitude: 10, floatDuration: 1600, delay: 200 })
    this.dropIn(jogo,      { amplitude: 9,  floatDuration: 2300, delay: 300 })
    this.dropIn(scoreText, { amplitude: 0,  floatDuration: 0,    delay: 350 })
    this.dropIn(bestText,  { amplitude: 0,  floatDuration: 0,    delay: 400 })
    this.dropIn(btnHome,   { amplitude: 0,  floatDuration: 0,    delay: 450 })
    this.dropIn(btnPlay,   { amplitude: 0,  floatDuration: 0,    delay: 500 })

    btnHome.on('pointerover', () => btnHome.setAlpha(1))
    btnHome.on('pointerout',  () => btnHome.setAlpha(0.85))
    btnHome.on('pointerdown', () => this.exitTo('menu-scene', allElements))

    btnPlay.on('pointerover', () => btnPlay.setAlpha(1))
    btnPlay.on('pointerout',  () => btnPlay.setAlpha(0.85))
    btnPlay.on('pointerdown', () => this.scene.start('main-scene'))

  }

  private dropIn(
    obj: Phaser.GameObjects.Image | Phaser.GameObjects.Text,
    opts: { amplitude: number; floatDuration: number; delay: number },
  ) {
    const finalY = obj.y
    obj.y = -Math.abs(obj.displayHeight) - 20

    this.tweens.add({
      targets: obj,
      y: finalY,
      duration: 900,
      delay: opts.delay,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (opts.amplitude > 0) {
          this.tweens.add({
            targets: obj,
            y: finalY + opts.amplitude,
            duration: opts.floatDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        }
      },
    })
  }

  private exitTo(scene: string, elements: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[]) {
    elements.forEach((el, i) => {
      this.tweens.killTweensOf(el)
      this.tweens.add({
        targets: el,
        y: -WORLD.height,
        duration: 600,
        delay: i * 40,
        ease: 'Cubic.easeIn',
        onComplete: i === elements.length - 1 ? () => this.scene.start(scene) : undefined,
      })
    })
  }
}
