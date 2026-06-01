import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { getLang, setLang, type Lang } from '../lang'
import { playSfx } from './AudioManager'

const CX = WORLD.width / 2
const CY = WORLD.height / 2

const PANEL_W = 360
const PANEL_H = 260
const PANEL_TOP = CY - PANEL_H / 2 + 20

const DEPTH = 50

const LANG_OPTIONS: { lang: Lang; flag: string; label: string }[] = [
  { lang: 'pt', flag: '🇧🇷', label: 'Português' },
  { lang: 'en', flag: '🇺🇸', label: 'English' },
]

export class LangSelectPanel {
  private scene: Phaser.Scene
  private objects: Phaser.GameObjects.GameObject[] = []
  private _visible = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.build()
    this.setAllVisible(false)
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj)
    return obj
  }

  private build() {
    const s = this.scene
    const currentLang = getLang()

    // Dim overlay
    this.track(
      s.add.rectangle(CX, CY, WORLD.width, WORLD.height, 0x000000, 0.6)
        .setDepth(DEPTH)
        .setInteractive()
    )

    // Panel background
    this.track(
      s.add.image(CX, CY - 10, 'modal-bg2')
        .setDisplaySize(PANEL_W, PANEL_H)
        .setDepth(DEPTH + 1)
    )

    // Title
    this.track(
      s.add.text(CX, PANEL_TOP + 28, 'Idioma / Language', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(DEPTH + 2)
    )

    // Close button
    const closeBtn = this.track(
      s.add.text(CX + PANEL_W / 2 - 40, PANEL_TOP + 18, '✕', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true })
    )
    closeBtn.on('pointerdown', () => this.hide())
    closeBtn.on('pointerover', () => (closeBtn as Phaser.GameObjects.Text).setAlpha(0.6))
    closeBtn.on('pointerout',  () => (closeBtn as Phaser.GameObjects.Text).setAlpha(1))

    // Language options
    const OPT_W = 210
    const OPT_H = 46
    const optionYs = [PANEL_TOP + 95, PANEL_TOP + 152]

    LANG_OPTIONS.forEach(({ lang, flag, label }, i) => {
      const isActive = lang === currentLang
      const y = optionYs[i]
      const fillColor = isActive ? 0xffd700 : 0x333333
      const fillAlpha = isActive ? 0.25 : 0.55

      const bg = this.track(
        s.add.rectangle(CX, y, OPT_W, OPT_H, fillColor, fillAlpha)
          .setDepth(DEPTH + 2)
          .setInteractive({ useHandCursor: !isActive })
      ) as Phaser.GameObjects.Rectangle

      if (isActive) {
        this.track(
          s.add.rectangle(CX, y, OPT_W, OPT_H)
            .setStrokeStyle(2, 0xffd700, 1)
            .setDepth(DEPTH + 3)
        )
      }

      const optTxt = this.track(
        s.add.text(CX, y, `${flag}  ${label}`, {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: isActive ? '#ffd700' : '#cccccc',
        }).setOrigin(0.5).setDepth(DEPTH + 3)
      ) as Phaser.GameObjects.Text

      if (!isActive) {
        bg.on('pointerover', () => bg.setFillStyle(0x555555, 0.8))
        bg.on('pointerout',  () => bg.setFillStyle(0x333333, 0.55))
        bg.on('pointerdown', () => this.select(lang))
        optTxt.setInteractive({ useHandCursor: true })
        optTxt.on('pointerdown', () => this.select(lang))
      }
    })
  }

  private select(lang: Lang) {
    playSfx(this.scene, 'button-click')
    setLang(lang)
    this.scene.scene.restart()
  }

  private setAllVisible(v: boolean) {
    for (const obj of this.objects) {
      if ('setVisible' in obj) (obj as Phaser.GameObjects.Image).setVisible(v)
    }
  }

  show() {
    this.setAllVisible(true)
    this._visible = true
  }

  hide() {
    this.setAllVisible(false)
    this._visible = false
  }

  isVisible() { return this._visible }

  destroy() {
    for (const obj of this.objects) obj.destroy()
    this.objects = []
  }
}
