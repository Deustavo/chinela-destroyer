import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { AudioManager } from './AudioManager'
import type { MusicScene } from '../scenes/MusicScene'

const CX = WORLD.width / 2
const CY = WORLD.height / 2

const PANEL_W = 305
const PANEL_H = 215
const PANEL_TOP  = CY - PANEL_H / 2

const SEG_W   = 21
const SEG_H   = 20
const SEG_GAP = 3

// Center the [speaker | gap | slider] group horizontally inside the panel
const SPEAKER_D  = 30
const SLIDER_GAP = 10
const SLIDER_W   = 10 * SEG_W + 9 * SEG_GAP          // 237
const CONTENT_W  = SPEAKER_D + SLIDER_GAP + SLIDER_W  // 277
const SPEAKER_X  = CX - CONTENT_W / 2 + SPEAKER_D / 2 // center of speaker icon
const SLIDER_X   = SPEAKER_X + SPEAKER_D / 2  // left edge of first segment

const ROW_MUSIC_LBL_Y = PANEL_TOP + 65
const ROW_MUSIC_Y     = PANEL_TOP + 90
const ROW_SFX_LBL_Y  = PANEL_TOP + 130
const ROW_SFX_Y       = PANEL_TOP + 155

const DEPTH = 50

export class AudioVolumePanel {
  private scene: Phaser.Scene
  private objects: Phaser.GameObjects.GameObject[] = []

  private musicSegs: Phaser.GameObjects.Rectangle[] = []
  private musicBlocked!: Phaser.GameObjects.Image

  private sfxSegs: Phaser.GameObjects.Rectangle[] = []
  private sfxBlocked!: Phaser.GameObjects.Image

  private _visible = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.build()
    this.setAllVisible(false)
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj)
    return obj
  }

  private build() {
    const s = this.scene

    // Dim overlay — blocks interaction with elements behind
    this.add(
      s.add.rectangle(CX, CY, WORLD.width, WORLD.height, 0x000000, 0.55)
        .setDepth(DEPTH)
        .setInteractive()
    )
    // Panel background
    this.add(
      s.add.rectangle(CX, CY, PANEL_W, PANEL_H, 0x1a1a2e)
        .setDepth(DEPTH + 1)
        .setStrokeStyle(2, 0xffd700)
    )

    // Title
    this.add(
      s.add.text(CX, PANEL_TOP + 26, 'Volume', {
        fontFamily: FONT_FAMILY, fontSize: '26px', color: '#ffd700',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(DEPTH + 2)
    )

    // Close button
    const closeBtn = this.add(
      s.add.text(CX + PANEL_W / 2 - 16, PANEL_TOP + 16, '✕', {
        fontFamily: FONT_FAMILY, fontSize: '22px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true })
    )
    closeBtn.on('pointerdown', () => this.hide())
    closeBtn.on('pointerover', () => (closeBtn as Phaser.GameObjects.Text).setAlpha(0.6))
    closeBtn.on('pointerout',  () => (closeBtn as Phaser.GameObjects.Text).setAlpha(1))

    // Row labels
    this.add(s.add.text(CX, ROW_MUSIC_LBL_Y, 'Música', {
      fontFamily: FONT_FAMILY, fontSize: '17px', color: '#cccccc',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH + 2))

    this.add(s.add.text(CX, ROW_SFX_LBL_Y, 'Efeitos', {
      fontFamily: FONT_FAMILY, fontSize: '17px', color: '#cccccc',
    }).setOrigin(0.5, 0.5).setDepth(DEPTH + 2))

    // Music row
    this.add(this.buildSpeaker(SPEAKER_X, ROW_MUSIC_Y, () => {
      AudioManager.setMusicMuted(!AudioManager.isMusicMuted())
      this.applyMusicVolume()
      this.refreshMusic()
    }))
    this.musicBlocked = this.add(this.buildBlocked(SPEAKER_X, ROW_MUSIC_Y))
    this.musicSegs = this.buildSlider(SLIDER_X, ROW_MUSIC_Y, (lvl) => {
      AudioManager.setMusicLevel(lvl)
      AudioManager.setMusicMuted(false)
      this.applyMusicVolume()
      this.refreshMusic()
    })

    // SFX row
    this.add(this.buildSpeaker(SPEAKER_X, ROW_SFX_Y, () => {
      AudioManager.setSfxMuted(!AudioManager.isSfxMuted())
      this.refreshSfx()
    }))
    this.sfxBlocked = this.add(this.buildBlocked(SPEAKER_X, ROW_SFX_Y))
    this.sfxSegs = this.buildSlider(SLIDER_X, ROW_SFX_Y, (lvl) => {
      AudioManager.setSfxLevel(lvl)
      AudioManager.setSfxMuted(false)
      this.refreshSfx()
    })
  }

  private buildSpeaker(x: number, y: number, onClick: () => void): Phaser.GameObjects.Image {
    const img = this.scene.add.image(x, y, 'btn-audio')
      .setDisplaySize(30, 30).setOrigin(0.5)
      .setDepth(DEPTH + 2).setInteractive({ useHandCursor: true })
    img.on('pointerdown', onClick)
    img.on('pointerover', () => img.setAlpha(0.7))
    img.on('pointerout',  () => img.setAlpha(1))
    return img
  }

  private buildBlocked(x: number, y: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x, y, 'shop-blocked')
      .setDisplaySize(26, 26).setOrigin(0.5)
      .setDepth(DEPTH + 3).setAlpha(0)
  }

  private buildSlider(
    startX: number,
    y: number,
    onChange: (level: number) => void,
  ): Phaser.GameObjects.Rectangle[] {
    const segs: Phaser.GameObjects.Rectangle[] = []
    for (let i = 0; i < 10; i++) {
      const sx = startX + i * (SEG_W + SEG_GAP) + SEG_W / 2
      const seg = this.scene.add.rectangle(sx, y, SEG_W, SEG_H, 0x555555)
        .setDepth(DEPTH + 2).setInteractive({ useHandCursor: true })
      seg.on('pointerdown', () => onChange(i + 1))
      seg.on('pointerover', () => seg.setAlpha(0.75))
      seg.on('pointerout',  () => seg.setAlpha(1))
      this.objects.push(seg)
      segs.push(seg)
    }
    return segs
  }

  private refreshMusic() {
    const lvl   = AudioManager.getMusicLevel()
    const muted = AudioManager.isMusicMuted()
    this.musicSegs.forEach((seg, i) => {
      seg.setFillStyle((!muted && i < lvl) ? 0xffd700 : 0x444444)
    })
    this.musicBlocked.setAlpha(muted ? 1 : 0)
  }

  private refreshSfx() {
    const lvl   = AudioManager.getSfxLevel()
    const muted = AudioManager.isSfxMuted()
    this.sfxSegs.forEach((seg, i) => {
      seg.setFillStyle((!muted && i < lvl) ? 0x44aaff : 0x444444)
    })
    this.sfxBlocked.setAlpha(muted ? 1 : 0)
  }

  private applyMusicVolume() {
    const musicScene = this.scene.scene.get('music-scene') as MusicScene | null
    musicScene?.applyMusicVolume()
  }

  private setAllVisible(v: boolean) {
    for (const obj of this.objects) {
      if ('setVisible' in obj) (obj as Phaser.GameObjects.Image).setVisible(v)
    }
  }

  show() {
    this.setAllVisible(true)
    this.refreshMusic()
    this.refreshSfx()
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
