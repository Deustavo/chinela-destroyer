import Phaser from 'phaser'
import { WORLD } from '../config/constants'
import { addBackground, addCoinCounter } from '../utils/uiHelpers'
import { dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    addBackground(this)
    addCoinCounter(this)

    const logo = this.add
      .image(cx, cy - 60, 'menu-logo')
      .setScale(2.2)
      .setDepth(1)

    const chinela = this.add
      .image(cx - 80, cy + 40, 'menu-chinela')
      .setScale(3.2)
      .setDepth(2)

    const pera = this.add
      .image(cx + 80, cy - 180, 'menu-pera')
      .setScale(2)
      .setDepth(2)

    const btn = this.add
      .image(cx, cy + 176, 'menu-play-btn')
      .setScale(1.8)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    // Credits + Shop side-by-side, centered as a pair (both 64×64 native, scale 1.6)
    const BTN_SCALE = 1.6
    const BTN_SIZE = 64 * BTN_SCALE  // = 102.4
    const BTN_GAP = 18
    const btnRowY = cy + 240

    const btnCredits = this.add
      .image(cx - (BTN_SIZE / 2 + BTN_GAP / 2), btnRowY, 'menu-credits-btn')
      .setScale(BTN_SCALE)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    const btnShop = this.add
      .image(cx + (BTN_SIZE / 2 + BTN_GAP / 2), btnRowY, 'menu-shop-btn')
      .setScale(BTN_SCALE)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.9)

    const btnTrophy = this.add
      .image(WORLD.width - 44, WORLD.height - 44, 'btn-trophy')
      .setDisplaySize(56, 56)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.9)

    // Reduce hitbox height: play = 1/3, credits = 1/2 (both centered)
    const haBtn = btn.input!.hitArea as Phaser.Geom.Rectangle
    haBtn.y += haBtn.height / 3
    haBtn.height /= 3

    const haCredits = btnCredits.input!.hitArea as Phaser.Geom.Rectangle
    haCredits.y += haCredits.height / 4
    haCredits.height /= 2

    const haShop = btnShop.input!.hitArea as Phaser.Geom.Rectangle
    haShop.y += haShop.height / 4
    haShop.height /= 2

    const all: SceneObject[] = [logo, chinela, pera, btn, btnCredits, btnTrophy, btnShop]

    btn.on('pointerover', () => btn.setScale(2.0))
    btn.on('pointerout', () => btn.setScale(1.8))
    btn.on('pointerdown', () => exitTo(this, 'main-scene', all))

    btnCredits.on('pointerover', () => btnCredits.setScale(BTN_SCALE + 0.12))
    btnCredits.on('pointerout', () => btnCredits.setScale(BTN_SCALE))
    btnCredits.on('pointerdown', () => exitTo(this, 'credits-scene', all))

    btnTrophy.on('pointerover', () => btnTrophy.setAlpha(1))
    btnTrophy.on('pointerout', () => btnTrophy.setAlpha(0.9))
    btnTrophy.on('pointerdown', () => exitTo(this, 'achievements-scene', all))

    btnShop.on('pointerover', () => { btnShop.setAlpha(1); btnShop.setScale(BTN_SCALE + 0.12) })
    btnShop.on('pointerout', () => { btnShop.setAlpha(0.9); btnShop.setScale(BTN_SCALE) })
    btnShop.on('pointerdown', () => exitTo(this, 'shop-scene', all))

    this.input.keyboard?.once('keydown-SPACE', () => exitTo(this, 'main-scene', all))
    this.input.keyboard?.once('keydown-ENTER', () => exitTo(this, 'main-scene', all))

    dropInFloat(this, logo,       { amplitude: 8,  floatDuration: 2000, delay: 0   })
    dropInFloat(this, chinela,    { amplitude: 12, floatDuration: 1800, delay: 120 })
    dropInFloat(this, pera,       { amplitude: 10, floatDuration: 2200, delay: 240 })
    dropInFloat(this, btn,        { amplitude: 6,  floatDuration: 1600, delay: 360 })
    dropInFloat(this, btnCredits, { amplitude: 5,  floatDuration: 1700, delay: 440 })
    dropInFloat(this, btnTrophy,  { amplitude: 4,  floatDuration: 1900, delay: 520 })
    dropInFloat(this, btnShop,    { amplitude: 4,  floatDuration: 1900, delay: 560 })
  }
}
