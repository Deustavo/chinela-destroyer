import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter, createSecondaryButton } from '../utils/uiHelpers'
import { dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { NotificationManager } from '../utils/NotificationManager'
import { AudioVolumePanel } from '../utils/AudioVolumePanel'
import { playSfx } from '../utils/AudioManager'

export class MenuScene extends Phaser.Scene {
  private audioPanel?: AudioVolumePanel

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

    const BTN_SCALE = 1
    const btnTex = this.textures.get('btn-secondary').getSourceImage()
    const BTN_W = (btnTex as HTMLImageElement).width * BTN_SCALE * 2
    const BTN_GAP = 18
    const btnRow1Y = cy + 180
    const btnRow2Y = btnRow1Y + 54

    const PRIMARY_SCALE = 1.3
    const primaryBg = this.add.image(0, 0, 'btn-primary').setScale(2)
    const primaryTxt = this.add.text(0, 0, 'Jogar!', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#000000',
    }).setOrigin(0.5)
    const btn = this.add.container(cx, cy + 116, [primaryBg, primaryTxt])
      .setSize(primaryBg.width * 2, primaryBg.height * 2)
      .setScale(PRIMARY_SCALE)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    const colLeft  = cx - (BTN_W / 2 + BTN_GAP / 2)
    const colRight = cx + (BTN_W / 2 + BTN_GAP / 2)

    const btnShop       = createSecondaryButton(this, colLeft,  btnRow1Y, 'Loja',       undefined, BTN_SCALE)
    const btnInventory  = createSecondaryButton(this, colRight, btnRow1Y, 'Inventário', undefined, BTN_SCALE)
    const btnConquistas = createSecondaryButton(this, colLeft,  btnRow2Y, 'Conquistas', undefined, BTN_SCALE)
    const btnCredits    = createSecondaryButton(this, colRight, btnRow2Y, 'Créditos',   undefined, BTN_SCALE)

    // Audio button — top-left corner
    const audioBtn = this.add.image(28, 28, 'btn-audio')
      .setDisplaySize(38, 38)
      .setOrigin(0.5)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })

    audioBtn.on('pointerover', () => audioBtn.setAlpha(0.75))
    audioBtn.on('pointerout',  () => audioBtn.setAlpha(1))
    audioBtn.on('pointerdown', () => {
      playSfx(this, 'button-click')
      this.audioPanel?.show()
    })

    // Audio volume panel (built once, shown on demand)
    this.audioPanel = new AudioVolumePanel(this)

    const all: SceneObject[] = [logo, chinela, pera, btn, btnShop, btnInventory, btnConquistas, btnCredits, audioBtn]

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

    const playClick = () => playSfx(this, 'button-click')

    btn.on('pointerover', () => btn.setScale(PRIMARY_SCALE + 0.12))
    btn.on('pointerout', () => btn.setScale(PRIMARY_SCALE))
    btn.on('pointerdown', () => { playClick(); exitTo(this, 'main-scene', all) })

    btnShop.on('pointerdown',       () => { playClick(); exitTo(this, 'shop-scene', all, { tab: 'shop' }) })
    btnInventory.on('pointerdown',  () => { playClick(); exitTo(this, 'shop-scene', all, { tab: 'inventory' }) })
    btnConquistas.on('pointerdown', () => { playClick(); exitTo(this, 'achievements-scene', all) })
    btnCredits.on('pointerdown',    () => { playClick(); exitTo(this, 'credits-scene', all) })

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
    dropInFloat(this, audioBtn,      { amplitude: 4,  floatDuration: 1800, delay: 680 })

    this.showMusicCredit()
  }

  private showMusicCredit() {
    const { width, height } = this.cameras.main
    const text = this.add.text(width / 2, height - 24, '♫ Jeremy Black - Helios ♪', {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: FONT_FAMILY,
      stroke: '#000000',
      strokeThickness: 3,
    })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0)

    this.tweens.add({ targets: text, alpha: 1, duration: 400 })

    const dismiss = () => {
      if (!text.active) return
      this.tweens.add({ targets: text, alpha: 0, duration: 400, onComplete: () => text.destroy() })
      this.input.off('pointerdown', dismiss)
    }

    this.time.delayedCall(10000, dismiss)
    this.input.once('pointerdown', dismiss)
  }

  shutdown() {
    this.audioPanel?.destroy()
    this.audioPanel = undefined
  }
}
