import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter, wireButtonLabel, bindEscapeKey, applySceneMuffle } from '../utils/uiHelpers'
import { dropIn, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { playSfx } from '../utils/AudioManager'
import { fetchTop, isConfigured, type GameMode, type ScoreEntry } from '../utils/Leaderboard'
import { t } from '../lang'

const LIST_TOP = 168
const ROW_H = 34
const MAX_ROWS = 12
const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']

export class RankingScene extends Phaser.Scene {
  private mode: GameMode = 'normal'
  private scoreCache: Partial<Record<GameMode, ScoreEntry[]>> = {}
  private rowObjects: Phaser.GameObjects.GameObject[] = []
  private tabNormal!: Phaser.GameObjects.Container
  private tabSemFim!: Phaser.GameObjects.Container
  private destroyed = false

  constructor() {
    super('ranking-scene')
  }

  private playClick() { playSfx(this, 'button-click') }

  create() {
    this.destroyed = false
    this.scoreCache = {}
    const cx = WORLD.width / 2

    addBackground(this)
    addCoinCounter(this)
    applySceneMuffle(this)

    const trophy = this.add.image(cx - 96, 60, 'btn-trophy').setDisplaySize(38, 38).setDepth(1)
    const title = this.add
      .text(cx + 6, 60, t('ranking_title'), {
        fontSize: '32px', color: '#ffd700', fontFamily: FONT_FAMILY,
        stroke: '#000000', strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1)

    // ── Mode tabs ──────────────────────────────────────────────────────────────
    this.tabNormal = this.makeTab(cx - 82, 118, t('normal'), 'normal')
    this.tabSemFim = this.makeTab(cx + 82, 118, t('endless'), 'semFim')

    const backBtn = this.add
      .image(cx, WORLD.height - 52, 'btn-home')
      .setDisplaySize(64, 64)
      .setDepth(3)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true })

    const labelBack = this.add
      .text(cx, WORLD.height - 30, t('home'), { fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const goBack = () => {
      this.playClick()
      // Include the current rows/message so the whole screen flies out on exit.
      const els: SceneObject[] = [
        trophy, title, this.tabNormal, this.tabSemFim,
        ...(this.rowObjects as unknown as SceneObject[]),
        backBtn, labelBack,
      ]
      exitTo(this, 'menu-scene', els)
    }
    wireButtonLabel(backBtn, labelBack, goBack)
    bindEscapeKey(this, goBack)

    const intro: SceneObject[] = [trophy, title, this.tabNormal, this.tabSemFim, backBtn, labelBack]
    intro.forEach((el, i) => dropIn(this, el, i * 60))

    this.selectMode('normal')
  }

  private makeTab(x: number, y: number, label: string, mode: GameMode): Phaser.GameObjects.Container {
    const bg = this.add.image(0, 0, 'btn-secondary').setScale(2)
    const txt = this.add.text(0, 0, label, { fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000' }).setOrigin(0.5)
    const container = this.add.container(x, y, [bg, txt])
      .setSize(bg.width * 2, bg.height * 2)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
    container.on('pointerdown', () => { if (this.mode !== mode) { this.playClick(); this.selectMode(mode) } })
    return container
  }

  private selectMode(mode: GameMode) {
    this.mode = mode
    this.tabNormal.setAlpha(mode === 'normal' ? 1 : 0.5)
    this.tabSemFim.setAlpha(mode === 'semFim' ? 1 : 0.5)
    this.tabNormal.setScale(mode === 'normal' ? 1.08 : 0.94)
    this.tabSemFim.setScale(mode === 'semFim' ? 1.08 : 0.94)

    const cached = this.scoreCache[mode]
    if (cached) { this.renderList(cached); return }

    if (!isConfigured()) { this.renderMessage(t('ranking_unconfigured')); return }

    this.renderMessage(t('ranking_loading'))
    fetchTop(mode).then((entries) => {
      if (this.destroyed || this.mode !== mode) return
      this.scoreCache[mode] = entries
      this.renderList(entries)
    })
  }

  private clearRows() {
    this.rowObjects.forEach(o => o.destroy())
    this.rowObjects = []
  }

  private renderMessage(msg: string) {
    this.clearRows()
    const baseY = LIST_TOP + 140
    const text = this.add
      .text(WORLD.width / 2, baseY, msg, {
        fontSize: '17px', color: '#cccccc', fontFamily: FONT_FAMILY, align: 'center',
        wordWrap: { width: WORLD.width - 60 },
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0)
    text.y = baseY + 14
    this.tweens.add({ targets: text, y: baseY, alpha: 1, duration: 280, ease: 'Cubic.easeOut' })
    this.rowObjects.push(text)
  }

  private renderList(entries: ScoreEntry[]) {
    this.clearRows()
    if (entries.length === 0) { this.renderMessage(t('ranking_empty')); return }

    const cx = WORLD.width / 2
    const left = cx - 150
    const right = cx + 150
    const rows = entries.slice(0, MAX_ROWS)

    rows.forEach((entry, i) => {
      const y = LIST_TOP + i * ROW_H
      const color = MEDAL_COLORS[i] ?? '#ffffff'

      const stripe = this.add
        .rectangle(cx, y, WORLD.width - 40, ROW_H - 4, 0x000000, i % 2 === 0 ? 0.28 : 0.16)
        .setDepth(1)

      const rank = this.add
        .text(left, y, `${i + 1}`, { fontSize: '18px', color, fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3 })
        .setOrigin(0, 0.5)
        .setDepth(2)

      const name = this.add
        .text(left + 34, y, entry.name, { fontSize: '17px', color: '#ffffff', fontFamily: FONT_FAMILY })
        .setOrigin(0, 0.5)
        .setDepth(2)
      name.setText(this.truncateToWidth(entry.name, 170))

      const score = this.add
        .text(right, y, String(entry.score), { fontSize: '18px', color, fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3 })
        .setOrigin(1, 0.5)
        .setDepth(2)

      this.rowObjects.push(stripe, rank, name, score)
      // Each row slides up from a small offset and fades in, staggered top-to-bottom.
      const rowCells = [stripe, rank, name, score] as (Phaser.GameObjects.Components.Alpha & { y: number })[]
      rowCells.forEach(o => { o.setAlpha(0); o.y = y + 16 })
      this.tweens.add({ targets: rowCells, alpha: 1, y, duration: 300, delay: i * 55, ease: 'Cubic.easeOut' })
    })
  }

  private truncateToWidth(text: string, maxWidth: number): string {
    const probe = this.add.text(0, 0, text, { fontSize: '17px', fontFamily: FONT_FAMILY }).setVisible(false)
    let result = text
    while (result.length > 1 && probe.width > maxWidth) {
      result = result.slice(0, -1)
      probe.setText(result + '…')
    }
    const final = probe.width > maxWidth || result !== text ? result + '…' : text
    probe.destroy()
    return final
  }

  shutdown() {
    this.destroyed = true
    this.clearRows()
  }
}
