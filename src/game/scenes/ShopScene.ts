import Phaser from 'phaser'
import { WORLD } from '../config/constants'

const FONT = '"Comic Neue", "Comic Sans MS", cursive'

// --- Card dimensions ---
const CARD_W = 110
const CARD_GAP = 16
const CARD_H = 168
const IMG_SIZE = 82

// 2.5 cards visible: 2 full + 1.5 gaps + half card
const VISIBLE_W = 2.5 * CARD_W + 1.5 * CARD_GAP  // = 299
const VP_X = Math.round((WORLD.width - VISIBLE_W) / 2) // ≈ 53
const VP_Y = 180
const VP_H = CARD_H + 6

// --- Shop items (placeholders until real art is provided) ---
const ITEMS = [
  { id: 0, name: 'Turbo',  price: 100, color: 0xff6b35 },
  { id: 1, name: 'Escudo', price: 250, color: 0x4ecdc4 },
  { id: 2, name: 'Duplo',  price: 400, color: 0xffe66d },
  { id: 3, name: 'Magnet', price: 600, color: 0xa8e6cf },
  { id: 4, name: 'Ninja',  price: 900, color: 0xd4a5a5 },
]

// Loose type accepted by both dropIn and exitTo
type Animatable = { y: number; displayHeight?: number }

export class ShopScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container
  private scrollX = 0
  private maxScrollX = 0
  private selectedId = 0
  private cardBgs: Phaser.GameObjects.Rectangle[] = []

  private previewRect!: Phaser.GameObjects.Rectangle
  private previewLabel!: Phaser.GameObjects.Text
  private previewPriceTxt!: Phaser.GameObjects.Text

  constructor() {
    super('shop-scene')
  }

  create() {
    const cx = WORLD.width / 2

    // Background
    this.add
      .image(cx, WORLD.height / 2, 'bg')
      .setDisplaySize(WORLD.width, WORLD.height)
      .setDepth(0)

    // ── Title ────────────────────────────────────────────────────────────────
    const title = this.add
      .text(cx, 82, 'Loja', {
        fontSize: '42px',
        color: '#ffd700',
        fontFamily: FONT,
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(2)

    // ── Scroll rail ──────────────────────────────────────────────────────────
    const totalW = ITEMS.length * (CARD_W + CARD_GAP) - CARD_GAP
    this.maxScrollX = Math.max(0, totalW - VISIBLE_W)

    this.scrollContainer = this.add.container(VP_X, VP_Y).setDepth(3)
    this.cardBgs = []

    ITEMS.forEach((item, i) => {
      const cx_card = i * (CARD_W + CARD_GAP) + CARD_W / 2
      const cy_card = CARD_H / 2

      const cardBg = this.add
        .rectangle(cx_card, cy_card, CARD_W, CARD_H, 0x1a1a2e)
        .setStrokeStyle(2, i === this.selectedId ? 0xffd700 : 0x334466)
      this.cardBgs.push(cardBg)

      const imgRect = this.add
        .rectangle(cx_card, IMG_SIZE / 2 + 14, IMG_SIZE, IMG_SIZE, item.color)

      const nameTxt = this.add
        .text(cx_card, IMG_SIZE + 26, item.name, {
          fontSize: '14px',
          color: '#ffffff',
          fontFamily: FONT,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0)

      const coin = this.add
        .image(cx_card - 14, CARD_H - 22, 'shop-coin')
        .setDisplaySize(18, 18)

      const priceTxt = this.add
        .text(cx_card, CARD_H - 22, `${item.price}`, {
          fontSize: '14px',
          color: '#ffd700',
          fontFamily: FONT,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0, 0.5)

      const hit = this.add
        .rectangle(cx_card, cy_card, CARD_W, CARD_H, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })

      hit.on('pointerover', () => {
        if (item.id !== this.selectedId) cardBg.setStrokeStyle(2, 0x6677aa)
      })
      hit.on('pointerout', () => {
        if (item.id !== this.selectedId) cardBg.setStrokeStyle(2, 0x334466)
      })
      hit.on('pointerdown', () => this.selectItem(item.id))

      this.scrollContainer.add([cardBg, imgRect, nameTxt, coin, priceTxt, hit])
    })

    // Geometry mask to clip the scroll area
    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(VP_X - 1, VP_Y - 1, VISIBLE_W + 2, VP_H + 2)
    this.scrollContainer.setMask(maskGfx.createGeometryMask())


    // ── Drag-to-scroll ───────────────────────────────────────────────────────
    let dragging = false
    let ptrStartX = 0
    let scrollStartX = 0

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < VP_Y || ptr.y > VP_Y + VP_H) return
      dragging = true
      ptrStartX = ptr.x
      scrollStartX = this.scrollX
    })
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!dragging) return
      const delta = ptr.x - ptrStartX
      this.scrollX = Phaser.Math.Clamp(scrollStartX - delta, 0, this.maxScrollX)
      this.scrollContainer.x = VP_X - this.scrollX
    })
    this.input.on('pointerup', () => { dragging = false })

    // ── Player + Selected item preview ───────────────────────────────────────
    const railBottom = VP_Y + VP_H
    const footerTop = WORLD.height - 110
    const midY = railBottom + (footerTop - railBottom) / 2

    const playerImg = this.add
      .image(cx - 72, midY, 'menu-chinela')
      .setDisplaySize(120, 120)
      .setDepth(2)

    const previewX = cx + 76
    const PREV = 106

    this.previewRect = this.add
      .rectangle(previewX, midY - 14, PREV, PREV, ITEMS[0].color)
      .setDepth(2)
      .setStrokeStyle(2, 0xffd700)

    this.previewLabel = this.add
      .text(previewX, midY - 14 + PREV / 2 + 6, ITEMS[0].name, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(2)

    const coinPrev = this.add
      .image(previewX - 16, midY - 14 + PREV / 2 + 32, 'shop-coin')
      .setDisplaySize(20, 20)
      .setDepth(2)

    this.previewPriceTxt = this.add
      .text(coinPrev.x + 14, coinPrev.y, `${ITEMS[0].price}`, {
        fontSize: '16px',
        color: '#ffd700',
        fontFamily: FONT,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5)
      .setDepth(2)


    // ── Home button ──────────────────────────────────────────────────────────
    const homeY = WORLD.height - 68

    const backBtn = this.add
      .image(cx, homeY, 'btn-home')
      .setDisplaySize(56, 56)
      .setDepth(3)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true })

    const labelBack = this.add
      .text(cx, homeY + 36, 'Inicio', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setAlpha(0.85)
      .setInteractive({ cursor: 'pointer' })

    // All elements that participate in enter/exit animations
    const all: Animatable[] = [
      title,
      this.scrollContainer,

      playerImg,
      this.previewRect,
      this.previewLabel,
      coinPrev,
      this.previewPriceTxt,

      backBtn,
      labelBack,
    ]

    const goBack = () => this.exitTo('menu-scene', all)
    backBtn.on('pointerover', () => { backBtn.setAlpha(1); labelBack.setAlpha(1) })
    backBtn.on('pointerout', () => { backBtn.setAlpha(0.85); labelBack.setAlpha(0.85) })
    backBtn.on('pointerdown', goBack)
    labelBack.on('pointerover', () => { backBtn.setAlpha(1); labelBack.setAlpha(1) })
    labelBack.on('pointerout', () => { backBtn.setAlpha(0.85); labelBack.setAlpha(0.85) })
    labelBack.on('pointerdown', goBack)

    // ── Drop-in animations ───────────────────────────────────────────────────
    all.forEach((obj, i) => this.dropIn(obj, i * 60))
  }

  private selectItem(id: number) {
    this.selectedId = id
    const item = ITEMS[id]
    this.cardBgs.forEach((rect, i) =>
      rect.setStrokeStyle(2, i === id ? 0xffd700 : 0x334466),
    )
    this.previewRect.setFillStyle(item.color)
    this.previewLabel.setText(item.name)
    this.previewPriceTxt.setText(`${item.price}`)
  }

  // Accepts any object that has a y position (Image, Text, Rectangle, Container…)
  private dropIn(obj: Animatable, delay: number) {
    const finalY = obj.y
    const h = obj.displayHeight ?? CARD_H
    obj.y = -Math.abs(h) - 40
    this.tweens.add({
      targets: obj,
      y: finalY,
      duration: 900,
      delay,
      ease: 'Cubic.easeOut',
    })
  }

  private exitTo(scene: string, elements: Animatable[]) {
    elements.forEach((el, i) => {
      this.tweens.killTweensOf(el)
      this.tweens.add({
        targets: el,
        y: -WORLD.height,
        duration: 600,
        delay: i * 40,
        ease: 'Cubic.easeIn',
        onComplete:
          i === elements.length - 1
            ? () => this.scene.start(scene)
            : undefined,
      })
    })
  }
}
