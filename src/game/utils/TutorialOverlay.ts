import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { storageGet, storageSet } from './storage'
import type { Player } from '../entities/Player'

const TUTORIAL_KEY = 'tutorialSeen'

const PANEL_W = 210
const MIN_STEP_MS = 800
const COMPLETE_PAUSE_MS = 2000

interface Step {
  lines: string[]
  check: (player: Player, stepMs: number) => boolean
}

const STEPS: Step[] = [
  {
    lines: ['← → para mover', '(ou botões laterais)'],
    check: (p) => Math.abs(p.body.velocity.x) > 5,
  },
  {
    lines: ['↑ ou W para pular', '(ou botão de pulo)'],
    check: (p) => p.body.velocity.y < -80,
  },
  {
    lines: ['ESPAÇO para atirar', '(ou botão de tiro)'],
    check: (p) => p.projectiles.getLength() > 0,
  },
  {
    lines: ['Destrua projéteis', 'da Pera para ganhar', 'moedas!'],
    check: (_p, ms) => ms > 3200,
  },
]

export class TutorialOverlay {
  private container: Phaser.GameObjects.Container
  private bg: Phaser.GameObjects.Rectangle
  private bodyText: Phaser.GameObjects.Text
  private hintText: Phaser.GameObjects.Text
  private stepIndex: number = 0
  private stepMs: number = 0
  private stepActionSeen: boolean = false
  private completing: boolean = false
  private completeMs: number = 0
  private _done: boolean = false
  private scene: Phaser.Scene
  private player: Player

  static shouldShow(): boolean {
    return storageGet(TUTORIAL_KEY) === null
  }

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player

    const cx = WORLD.width / 2
    const cy = WORLD.height * 0.25

    this.bg = scene.add
      .rectangle(0, 0, PANEL_W, this.panelHeightFor(STEPS[0].lines.length), 0x000000, 0.8)
      .setStrokeStyle(2, 0xffffff, 0.5)

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
      .setOrigin(0.5, 1)

    this.container = scene.add
      .container(cx, cy, [this.bg, this.bodyText, this.hintText])
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
    this.bg.setStrokeStyle(2, 0x00ff88, 1)
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
    const step = STEPS[idx]
    const h = this.panelHeightFor(step.lines.length)

    this.bodyText.setText(step.lines.join('\n'))
    this.bg.setSize(PANEL_W, h)
    this.bg.setStrokeStyle(2, 0xffffff, 0.5)
    this.hintText.setText(`${idx + 1} / ${STEPS.length}`)
    this.hintText.setPosition(0, h / 2 - 6)
  }

  private panelHeightFor(lineCount: number): number {
    return Math.max(80, lineCount * 22 + 42)
  }

  private finish(): void {
    this._done = true
    storageSet(TUTORIAL_KEY, '1')
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 400,
      onComplete: () => this.container.destroy(),
    })
  }
}
