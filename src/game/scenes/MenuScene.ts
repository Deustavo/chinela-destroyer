import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter } from '../utils/uiHelpers'
import { dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { NotificationManager } from '../utils/NotificationManager'

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
      .image(cx, cy - 100, 'menu-logo')
      .setScale(2.2)
      .setDepth(1)

    const chinela = this.add
      .image(cx - 80, cy, 'menu-chinela')
      .setScale(3.2)
      .setDepth(2)

    const pera = this.add
      .image(cx + 80, cy - 220, 'menu-pera')
      .setScale(2)
      .setDepth(2)

    const btn = this.add
      .image(cx, cy + 116, 'menu-play-btn')
      .setScale(1.8)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    const BTN_SCALE = 1
    const btnTex = this.textures.get('btn-secondary').getSourceImage()
    const BTN_W = (btnTex as HTMLImageElement).width * BTN_SCALE
    const BTN_GAP = 18
    const btnRow1Y = cy + 180
    const btnRow2Y = btnRow1Y + 54

    const makeSecondaryBtn = (x: number, y: number, label: string) => {
      const bg = this.add.image(0, 0, 'btn-secondary')
      const txt = this.add.text(0, 0, label, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#000000',
      }).setOrigin(0.5)
      const container = this.add.container(x, y, [bg, txt])
        .setSize(bg.width, bg.height)
        .setScale(BTN_SCALE)
        .setDepth(3)
        .setInteractive({ useHandCursor: true })
      return container
    }

    const colLeft  = cx - (BTN_W / 2 + BTN_GAP / 2)
    const colRight = cx + (BTN_W / 2 + BTN_GAP / 2)

    const btnShop       = makeSecondaryBtn(colLeft,  btnRow1Y, 'Loja')
    const btnInventory  = makeSecondaryBtn(colRight, btnRow1Y, 'Inventário')
    const btnConquistas = makeSecondaryBtn(colLeft,  btnRow2Y, 'Conquistas')
    const btnCredits    = makeSecondaryBtn(colRight, btnRow2Y, 'Créditos')

    // Reduce hitbox height on play button
    const haBtn = btn.input!.hitArea as Phaser.Geom.Rectangle
    haBtn.y += haBtn.height / 3
    haBtn.height /= 3

    const all: SceneObject[] = [logo, chinela, pera, btn, btnShop, btnInventory, btnConquistas, btnCredits]

    if (NotificationManager.hasNewItem()) {
      const dotX = btnInventory.x + BTN_W / 2 - 10
      const dotY  = btnInventory.y - 12
      const dot = this.add.circle(dotX, dotY, 8, 0xff0000).setDepth(5).setScale(0)
      all.push(dot as unknown as SceneObject)
      this.tweens.add({
        targets: dot,
        scale: 1,
        duration: 320,
        delay: 1120,
        ease: 'Back.Out',
        onComplete: () => {
          this.tweens.add({
            targets: dot,
            scale: 1.45,
            duration: 600,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1,
          })
        },
      })
    }

    btn.on('pointerover', () => btn.setScale(2.0))
    btn.on('pointerout', () => btn.setScale(1.8))
    btn.on('pointerdown', () => exitTo(this, 'main-scene', all))

    btnShop.on('pointerover', () => btnShop.setScale(BTN_SCALE + 0.12))
    btnShop.on('pointerout', () => btnShop.setScale(BTN_SCALE))
    btnShop.on('pointerdown', () => exitTo(this, 'shop-scene', all, { tab: 'shop' }))

    btnInventory.on('pointerover', () => btnInventory.setScale(BTN_SCALE + 0.12))
    btnInventory.on('pointerout', () => btnInventory.setScale(BTN_SCALE))
    btnInventory.on('pointerdown', () => exitTo(this, 'shop-scene', all, { tab: 'inventory' }))

    btnConquistas.on('pointerover', () => btnConquistas.setScale(BTN_SCALE + 0.12))
    btnConquistas.on('pointerout', () => btnConquistas.setScale(BTN_SCALE))
    btnConquistas.on('pointerdown', () => exitTo(this, 'achievements-scene', all))

    btnCredits.on('pointerover', () => btnCredits.setScale(BTN_SCALE + 0.12))
    btnCredits.on('pointerout', () => btnCredits.setScale(BTN_SCALE))
    btnCredits.on('pointerdown', () => exitTo(this, 'credits-scene', all))

    this.input.keyboard?.once('keydown-SPACE', () => exitTo(this, 'main-scene', all))
    this.input.keyboard?.once('keydown-ENTER', () => exitTo(this, 'main-scene', all))

    dropInFloat(this, logo,          { amplitude: 8,  floatDuration: 2000, delay: 0   })
    dropInFloat(this, chinela,       { amplitude: 12, floatDuration: 1800, delay: 120 })
    dropInFloat(this, pera,          { amplitude: 10, floatDuration: 2200, delay: 240 })
    dropInFloat(this, btn,           { amplitude: 6,  floatDuration: 1600, delay: 360 })
    dropInFloat(this, btnShop,       { amplitude: 5,  floatDuration: 1700, delay: 440 })
    dropInFloat(this, btnInventory,  { amplitude: 4,  floatDuration: 1900, delay: 500 })
    dropInFloat(this, btnConquistas, { amplitude: 4,  floatDuration: 1900, delay: 560 })
    dropInFloat(this, btnCredits,    { amplitude: 4,  floatDuration: 1800, delay: 620 })
  }
}
