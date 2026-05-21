import Phaser from 'phaser'
import { WORLD } from '../config/constants'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    this.add
      .text(cx, cy - 100, 'CHINELA', {
        fontSize: '96px',
        fontStyle: 'bold',
        color: '#f5a623',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)

    this.add
      .text(cx, cy - 10, 'DESTROYER', {
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)

    const btn = this.add
      .text(cx, cy + 130, '[ INICIAR ]', {
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#1d1d1d',
        backgroundColor: '#f5a623',
        padding: { x: 28, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => btn.setStyle({ color: '#ffffff', backgroundColor: '#c47d0e' }))
    btn.on('pointerout', () => btn.setStyle({ color: '#1d1d1d', backgroundColor: '#f5a623' }))
    btn.on('pointerdown', () => this.scene.start('main-scene'))

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('main-scene'))
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('main-scene'))

    this.add
      .text(cx, cy + 220, 'Pressione SPACE ou ENTER para começar', {
        fontSize: '18px',
        color: '#888888',
      })
      .setOrigin(0.5)
  }
}
