import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { storageGet, storageSet } from './storage'
import type { Player } from '../entities/Player'

const TUTORIAL_KEY = 'tutorialSeen'

const PANEL_W = 250
const MIN_STEP_MS = 800
const COMPLETE_PAUSE_MS = 1000

// Index of the wrap step so the overlay knows when to show/hide edge arrows
const WRAP_STEP_INDEX = 1

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

interface ButtonHint { x: number; y: number; r: number }

const BTN_Y = WORLD.height - 60
const SHOT_BTN_X = WORLD.width - 60
const SHOT_BTN_Y = BTN_Y - 95

// Which steps show button highlight circles on touch devices
const STEP_BUTTON_HINTS: Record<number, ButtonHint[]> = {
  0: [
    { x: 60, y: BTN_Y, r: 58 },
    { x: 175, y: BTN_Y, r: 58 },
  ],
  2: [{ x: SHOT_BTN_X, y: BTN_Y, r: 58 }],
  3: [{ x: SHOT_BTN_X, y: SHOT_BTN_Y, r: 50 }],
}

interface Step {
  lines: string[]
  check: (player: Player, stepMs: number) => boolean
}

// Wrap detection uses a closure to track previous x across frames
let _prevX: number | null = null
let _wrapped = false
function resetWrapDetector() {
  _prevX = null
  _wrapped = false
}
function checkWrap(p: Player): boolean {
  const x = p.gameObject.x
  if (_prevX !== null) {
    const delta = Math.abs(x - _prevX)
    if (delta > WORLD.width * 0.5) _wrapped = true
  }
  _prevX = x
  return _wrapped
}

const STEPS: Step[] = [
  {
    lines: ['← → para mover', '(ou botões laterais)'],
    check: (p) => Math.abs(p.body.velocity.x) > 5,
  },
  {
    lines: ['Atravesse a borda', 'da tela para sair', 'pelo outro lado!'],
    check: (p) => checkWrap(p),
  },
  {
    lines: ['↑, W ou ESPAÇO', 'para pular', '(ou botão de pulo)'],
    check: (p) => p.body.velocity.y < -80,
  },
  {
    lines: ['B para atirar', '(ou botão de tiro)'],
    check: (p) => p.projectiles.getLength() > 0,
  },
  {
    lines: ['Destrua projéteis', 'da Pera para ganhar', 'moedas!'],
    check: (_p, ms) => ms > 3200,
  },
]

const ARROW_COLOR = 0xffff00
const ARROW_ALPHA = 0.85
const ARROW_SIZE = 18  // tip half-width
const ARROW_LEN = 28   // shaft length
const ARROW_Y = WORLD.height / 2  // vertical center of screen (screen space)

export class TutorialOverlay {
  private container: Phaser.GameObjects.Container
  private bg: Phaser.GameObjects.Image
  private bodyText: Phaser.GameObjects.Text
  private hintText: Phaser.GameObjects.Text
  private skipText: Phaser.GameObjects.Text
  private stepIndex: number = 0
  private stepMs: number = 0
  private stepActionSeen: boolean = false
  private completing: boolean = false
  private completeMs: number = 0
  private _done: boolean = false
  private scene: Phaser.Scene
  private player: Player
  private wrapArrows: Phaser.GameObjects.Graphics | null = null
  private buttonCircles: Phaser.GameObjects.Graphics | null = null

  static shouldShow(): boolean {
    return storageGet(TUTORIAL_KEY) === null
  }

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player

    const cx = WORLD.width / 2
    const cy = WORLD.height * 0.25

    this.bg = scene.add
      .image(0, 0, 'modal-bg2')
      .setDisplaySize(PANEL_W, this.panelHeightFor(STEPS[0].lines.length))

    this.bodyText = scene.add
      .text(0, -8, '', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0.5)

    this.hintText = scene.add
      .text(0, 0, '', {
        fontSize: '11px',
        color: '#aaaaaa',
        fontFamily: FONT_FAMILY,
      })
      .setOrigin(0, 1)

    this.skipText = scene.add
      .text(0, 0, 'Pular', {
        fontSize: '12px',
        color: '#ffcc00',
        fontFamily: FONT_FAMILY,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.skipText.setStyle({ color: '#ffffff' }))
      .on('pointerout', () => this.skipText.setStyle({ color: '#ffcc00' }))
      .on('pointerdown', () => this.finish())

    this.container = scene.add
      .container(cx, cy, [this.bg, this.bodyText, this.hintText, this.skipText])
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0)

    scene.tweens.add({ targets: this.container, alpha: 1, duration: 350 })
    this.applyStep(0)
  }

  get isDone(): boolean {
    return this._done
  }

  update(delta: number): void {
    if (this._done) return

    if (this.completing) {
      this.completeMs += delta
      if (this.completeMs >= COMPLETE_PAUSE_MS) {
        this.completing = false
        this.advance()
      }
      return
    }

    this.stepMs += delta

    // Sample every frame so brief windows (e.g. jump velocity) are never missed
    if (!this.stepActionSeen) {
      this.stepActionSeen = STEPS[this.stepIndex].check(this.player, this.stepMs)
    }

    if (this.stepMs > MIN_STEP_MS && this.stepActionSeen) {
      this.markComplete()
    }
  }

  private markComplete(): void {
    this.completing = true
    this.completeMs = 0
    this.hideWrapArrows()
    this.hideButtonCircles()
    this.bg.setTexture('modal-bg3')
  }

  private advance(): void {
    const next = this.stepIndex + 1
    if (next >= STEPS.length) {
      this.finish()
      return
    }

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.applyStep(next)
        this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 200 })
      },
    })
  }

  private applyStep(idx: number): void {
    this.stepIndex = idx
    this.stepMs = 0
    this.stepActionSeen = false
    this.completing = false
    this.completeMs = 0
    this.bg.setTexture('modal-bg2')
    const step = STEPS[idx]
    const h = this.panelHeightFor(step.lines.length)

    this.bodyText.setText(step.lines.join('\n'))
    this.bg.setDisplaySize(PANEL_W, h)
    this.hintText.setText(`${idx + 1} / ${STEPS.length}`)
    this.hintText.setPosition(-PANEL_W / 2 + 22, h / 2 - 16)
    this.skipText.setPosition(PANEL_W / 2 - 22, h / 2 - 16)

    if (idx === WRAP_STEP_INDEX) {
      resetWrapDetector()
      this.showWrapArrows()
    } else {
      this.hideWrapArrows()
    }

    const hints = STEP_BUTTON_HINTS[idx]
    if (hints && isTouchDevice()) {
      this.showButtonCircles(hints)
    } else {
      this.hideButtonCircles()
    }
  }

  private panelHeightFor(lineCount: number): number {
    return Math.max(95, lineCount * 24 + 56)
  }

  // Draw two arrows: one pointing left at the right edge, one pointing right at the left edge.
  // Both drawn in screen space (scrollFactor 0) to indicate wrap-around movement.
  private showWrapArrows(): void {
    if (this.wrapArrows) this.wrapArrows.destroy()

    const g = this.scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(61)
      .setAlpha(ARROW_ALPHA)

    this.wrapArrows = g

    const y = ARROW_Y
    const s = ARROW_SIZE
    const l = ARROW_LEN

    g.fillStyle(ARROW_COLOR, 1)
    g.lineStyle(3, ARROW_COLOR, 1)

    // Left edge: arrow pointing left (←) — exit through left wall
    const lx = 8 + s + l
    g.fillTriangle(lx - s - l, y, lx - l, y - s, lx - l, y + s)
    g.fillRect(lx - l, y - 4, l, 8)

    // Right edge: arrow pointing right (→) — exit through right wall
    const rx = WORLD.width - 8 - s - l
    g.fillTriangle(rx + s + l, y, rx + l, y - s, rx + l, y + s)
    g.fillRect(rx, y - 4, l, 8)

    // Pulse tween
    this.scene.tweens.add({
      targets: g,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private hideWrapArrows(): void {
    if (this.wrapArrows) {
      this.scene.tweens.killTweensOf(this.wrapArrows)
      this.wrapArrows.destroy()
      this.wrapArrows = null
    }
  }

  private showButtonCircles(hints: ButtonHint[]): void {
    this.hideButtonCircles()

    const g = this.scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(61)
      .setAlpha(0.9)

    this.buttonCircles = g

    for (const { x, y, r } of hints) {
      g.lineStyle(3, 0xffff00, 1)
      g.strokeCircle(x, y, r)
      g.lineStyle(1.5, 0xffff00, 0.35)
      g.strokeCircle(x, y, r + 8)
    }

    this.scene.tweens.add({
      targets: g,
      alpha: 0.25,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private hideButtonCircles(): void {
    if (this.buttonCircles) {
      this.scene.tweens.killTweensOf(this.buttonCircles)
      this.buttonCircles.destroy()
      this.buttonCircles = null
    }
  }

  private finish(): void {
    this._done = true
    this.hideWrapArrows()
    this.hideButtonCircles()
    storageSet(TUTORIAL_KEY, '1')
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 400,
      onComplete: () => this.container.destroy(),
    })
  }
}
