import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter, createSecondaryButton } from '../utils/uiHelpers'
import { dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { NotificationManager } from '../utils/NotificationManager'
import { AudioVolumePanel } from '../utils/AudioVolumePanel'
import { LangSelectPanel } from '../utils/LangSelectPanel'
import { playSfx } from '../utils/AudioManager'
import { storageGet } from '../utils/storage'
import { t, getLang } from '../lang'

export class MenuScene extends Phaser.Scene {
  private audioPanel?: AudioVolumePanel
  private langPanel?: LangSelectPanel

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

    // — Normal and Sem Fim buttons (both green, same size, side by side)
    const PRIMARY_SCALE = 1.3
    const primaryBtnTex = this.textures.get('btn-primary').getSourceImage()
    const PRIMARY_BTN_HALF_W = (primaryBtnTex as HTMLImageElement).width * 2 * PRIMARY_SCALE / 2
    const btnPlayY = cy + 115
    const playColLeft  = cx - PRIMARY_BTN_HALF_W - 8
    const playColRight = cx + PRIMARY_BTN_HALF_W + 8

    const normalBg = this.add.image(0, 0, 'btn-primary').setScale(2)
    const normalTxt = this.add.text(0, 0, t('normal'), {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#000000',
    }).setOrigin(0.5)
    const btnNormal = this.add.container(playColLeft, btnPlayY, [normalBg, normalTxt])
      .setSize(normalBg.width * 2, normalBg.height * 2)
      .setScale(PRIMARY_SCALE)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    const semFimUnlocked = storageGet('normalModeCompleted') === 'true'
    const semFimBg = this.add.image(0, 0, 'btn-primary').setScale(2)
    const semFimTxt = this.add.text(semFimUnlocked ? 0 : 6, 0, t('endless'), {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#000000',
    }).setOrigin(0.5)
    const semFimChildren: Phaser.GameObjects.GameObject[] = [semFimBg, semFimTxt]
    if (!semFimUnlocked) {
      const lockIcon = this.add.image(-40, 0, 'menu-lock').setDisplaySize(18, 18).setOrigin(0.5)
      semFimChildren.push(lockIcon)
    }
    const btnSemFim = this.add.container(playColRight, btnPlayY, semFimChildren)
      .setSize(semFimBg.width * 2, semFimBg.height * 2)
      .setScale(PRIMARY_SCALE)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    if (!semFimUnlocked) {
      btnSemFim.setAlpha(0.45)
      btnSemFim.on('pointerdown', () => playSfx(this, 'error', 3))
    }

    const colLeft  = cx - (BTN_W / 2 + BTN_GAP / 2)
    const colRight = cx + (BTN_W / 2 + BTN_GAP / 2)

    const btnShop       = createSecondaryButton(this, colLeft,  btnRow1Y, t('shop'),         undefined, BTN_SCALE)
    const btnInventory  = createSecondaryButton(this, colRight, btnRow1Y, t('inventory'),    undefined, BTN_SCALE)
    const btnConquistas = createSecondaryButton(this, colLeft,  btnRow2Y, t('achievements'), undefined, BTN_SCALE, '18px')
    const btnCredits    = createSecondaryButton(this, colRight, btnRow2Y, t('credits'),      undefined, BTN_SCALE)

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

    // Language button — top-left, right of audio button
    const currentLang = getLang()
    const langLabel = currentLang === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'
    const langBtnBg = this.add.rectangle(83, 28, 58, 32, 0x000000, 0.35)
      .setDepth(5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
    const langBtnTxt = this.add.text(83, 28, langLabel, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5)
      .setDepth(6)
      .setScrollFactor(0)

    langBtnBg.on('pointerover', () => langBtnBg.setFillStyle(0x222222, 0.7))
    langBtnBg.on('pointerout',  () => langBtnBg.setFillStyle(0x000000, 0.35))
    langBtnBg.on('pointerdown', () => {
      playSfx(this, 'button-click')
      this.langPanel?.show()
    })
    langBtnTxt.setInteractive({ useHandCursor: true })
    langBtnTxt.on('pointerdown', () => {
      playSfx(this, 'button-click')
      this.langPanel?.show()
    })

    // Audio volume panel and language panel (built once, shown on demand)
    this.audioPanel = new AudioVolumePanel(this)
    this.langPanel  = new LangSelectPanel(this)

    const all: SceneObject[] = [logo, chinela, pera, btnNormal, btnSemFim, btnShop, btnInventory, btnConquistas, btnCredits, audioBtn, langBtnBg, langBtnTxt]

    const addNotificationDot = (btn: Phaser.GameObjects.Container, delay: number) => {
      const dotX = btn.x + BTN_W / 2 - 10
      const dotY  = btn.y - 12
      const dot = this.add.circle(dotX, dotY, 8, 0xff0000).setDepth(5).setScale(0)
      all.push(dot as unknown as SceneObject)
      this.tweens.add({
        targets: dot,
        scale: 1,
        duration: 320,
        delay,
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

    if (NotificationManager.hasNewItem()) {
      addNotificationDot(btnInventory, 1120)
    }

    if (NotificationManager.hasNewAchievement()) {
      addNotificationDot(btnConquistas, 1200)
    }

    const playClick = () => playSfx(this, 'button-click')

    btnNormal.on('pointerover', () => btnNormal.setScale(PRIMARY_SCALE + 0.12))
    btnNormal.on('pointerout', () => btnNormal.setScale(PRIMARY_SCALE))
    btnNormal.on('pointerdown', () => { playClick(); exitTo(this, 'stage-select-scene', all) })

    if (semFimUnlocked) {
      btnSemFim.on('pointerover', () => btnSemFim.setScale(PRIMARY_SCALE + 0.12))
      btnSemFim.on('pointerout', () => btnSemFim.setScale(PRIMARY_SCALE))
      btnSemFim.on('pointerdown', () => { playClick(); exitTo(this, 'main-scene', all, { gameMode: 'semFim' }) })
    }

    btnShop.on('pointerdown',       () => { playClick(); exitTo(this, 'shop-scene', all, { tab: 'shop' }) })
    btnInventory.on('pointerdown',  () => { playClick(); exitTo(this, 'shop-scene', all, { tab: 'inventory' }) })
    btnConquistas.on('pointerdown', () => { playClick(); exitTo(this, 'achievements-scene', all) })
    btnCredits.on('pointerdown',    () => { playClick(); exitTo(this, 'credits-scene', all) })

    dropInFloat(this, logo,          { amplitude: 8,  floatDuration: 2000, delay: 0   })
    dropInFloat(this, chinela,       { amplitude: 12, floatDuration: 1800, delay: 120 })
    dropInFloat(this, pera,          { amplitude: 10, floatDuration: 2200, delay: 240 })
    dropInFloat(this, btnNormal,     { amplitude: 6,  floatDuration: 1600, delay: 360 })
    dropInFloat(this, btnSemFim,     { amplitude: 5,  floatDuration: 1700, delay: 420 })
    dropInFloat(this, btnShop,       { amplitude: 5,  floatDuration: 1700, delay: 480 })
    dropInFloat(this, btnInventory,  { amplitude: 4,  floatDuration: 1900, delay: 540 })
    dropInFloat(this, btnConquistas, { amplitude: 4,  floatDuration: 1900, delay: 600 })
    dropInFloat(this, btnCredits,    { amplitude: 4,  floatDuration: 1800, delay: 660 })
    dropInFloat(this, audioBtn,      { amplitude: 4,  floatDuration: 1800, delay: 720 })
    dropInFloat(this, langBtnBg,     { amplitude: 4,  floatDuration: 1800, delay: 760 })
    dropInFloat(this, langBtnTxt,    { amplitude: 4,  floatDuration: 1800, delay: 760 })

    this.showMusicCredit()
  }

  private showMusicCredit() {
    const { width, height } = this.cameras.main
    const text = this.add.text(width / 2, height - 24, t('music_credit'), {
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
    this.langPanel?.destroy()
    this.langPanel = undefined
  }
}
