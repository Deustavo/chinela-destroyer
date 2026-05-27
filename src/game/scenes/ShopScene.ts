import Phaser from 'phaser'
import { WORLD } from '../config/constants'

const FONT = '"Comic Neue", "Comic Sans MS", cursive'

// --- Card dimensions (square background) ---
const CARD_W = 130
const CARD_H = 130   // equal → always square (bg only)
const CARD_GAP = 14
const IMG_SIZE = 90  // icon fills most of the square bg

// text below the background
const LABEL_OFFSET = 10   // gap between bg bottom and name
const LABEL_H = 20        // name line height
const PRICE_H = 22        // price row height
const CARD_TOTAL_H = CARD_H + LABEL_OFFSET + LABEL_H + PRICE_H

// 2.5 cards visible: 2 full + 1.5 gaps + half card
const VISIBLE_W = 2.5 * CARD_W + 1.5 * CARD_GAP  // = 346
const VP_X = Math.round((WORLD.width - VISIBLE_W) / 2) // ≈ 30
const VP_Y = 180
const VP_H = CARD_TOTAL_H + 6

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
  private cardBgs: Phaser.GameObjects.Image[] = []

  private previewImg!: Phaser.GameObjects.Image
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

      // Background (square): modal-bg for selected, modal-bg2 for unselected
      const cardBg = this.add
        .image(cx_card, cy_card, i === this.selectedId ? 'modal-bg' : 'modal-bg2')
        .setDisplaySize(CARD_W, CARD_H)
      this.cardBgs.push(cardBg)

      // Item icon placeholder (colored square, centred in bg)
      const imgRect = this.add
        .rectangle(cx_card, cy_card, IMG_SIZE, IMG_SIZE, item.color)

      // ── Text below the background ─────────────────────────────────────────
      const nameY = CARD_H + LABEL_OFFSET

      // Item name
      const nameTxt = this.add
        .text(cx_card, nameY, item.name, {
          fontSize: '15px',
          color: '#ffffff',
          fontFamily: FONT,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0)

      // Price row
      const priceY = nameY + LABEL_H + 8
      const coin = this.add
        .image(cx_card - 14, priceY, 'shop-coin')
        .setDisplaySize(20, 20)

      const priceTxt = this.add
        .text(cx_card - 5, priceY, `${item.price}`, {
          fontSize: '15px',
          color: '#ffd700',
          fontFamily: FONT,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0, 0.5)

      // Invisible hit area covers entire card (bg + labels)
      const hit = this.add
        .rectangle(cx_card, CARD_TOTAL_H / 2, CARD_W, CARD_TOTAL_H, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })

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
      .image(cx - 84, midY - 36, 'chinela', 0)
      .setDisplaySize(148, 148)
      .setDepth(2)

    const previewX = cx + 88
    const PREV = 128  // square preview

    // Selected preview uses modal-bg (selected variant)
    this.previewImg = this.add
      .image(previewX, midY - 14, 'modal-bg')
      .setDisplaySize(PREV, PREV)
      .setDepth(2)

    this.previewLabel = this.add
      .text(previewX, midY - 14 + PREV / 2 + 8, ITEMS[0].name, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: FONT,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(2)

    const coinPrev = this.add
      .image(previewX - 18, midY - 14 + PREV / 2 + 42, 'shop-coin')
      .setDisplaySize(22, 22)
      .setDepth(2)

    this.previewPriceTxt = this.add
      .text(coinPrev.x + 13, coinPrev.y, `${ITEMS[0].price}`, {
        fontSize: '18px',
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
      this.previewImg,
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

    // Swap textures: selected → modal-bg, others → modal-bg2
    this.cardBgs.forEach((img, i) =>
      img.setTexture(i === id ? 'modal-bg' : 'modal-bg2'),
    )

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
