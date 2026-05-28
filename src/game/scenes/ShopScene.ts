import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, wireButtonLabel, addCoinCounter } from '../utils/uiHelpers'
import { dropIn, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { CoinManager } from '../utils/CoinManager'
import { PurchaseManager } from '../utils/PurchaseManager'
import { EquipManager } from '../utils/EquipManager'
import { ITEM_REGISTRY } from '../items/registry'

// --- Card dimensions (square background) ---
const CARD_W = 130
const CARD_H = 130
const CARD_GAP = 14
const IMG_SIZE = 90

// text below the background
const LABEL_OFFSET = 10
const LABEL_H = 20
const PRICE_H = 22
const CARD_TOTAL_H = CARD_H + LABEL_OFFSET + LABEL_H + PRICE_H

// 2.5 cards visible
const VISIBLE_W = 2.5 * CARD_W + 1.5 * CARD_GAP
const VP_X = Math.round((WORLD.width - VISIBLE_W) / 2)
const VP_Y = 140
const SCROLL_Y = VP_Y + 20
const VP_H = CARD_TOTAL_H + 6

export class ShopScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container
  private scrollX = 0
  private maxScrollX = 0
  private selectedIdx = 0
  private cardBgs: Phaser.GameObjects.Image[] = []

  private previewBg!: Phaser.GameObjects.Image
  private previewItemImg!: Phaser.GameObjects.Image
  private previewLabel!: Phaser.GameObjects.Text
  private previewDesc!: Phaser.GameObjects.Text
  private previewPriceTxt!: Phaser.GameObjects.Text
  private buyBtn!: Phaser.GameObjects.Text
  private coinCountText!: Phaser.GameObjects.Text

  constructor() {
    super('shop-scene')
  }

  create() {
    const cx = WORLD.width / 2

    addBackground(this)
    this.coinCountText = addCoinCounter(this)

    // ── Title ────────────────────────────────────────────────────────────────
    const title = this.add
      .text(cx, 82, 'Loja', {
        fontSize: '42px',
        color: '#ffd700',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(2)

    // ── Scroll rail ──────────────────────────────────────────────────────────
    const totalW = ITEM_REGISTRY.length * (CARD_W + CARD_GAP) - CARD_GAP
    this.maxScrollX = Math.max(0, totalW - VISIBLE_W)

    this.scrollContainer = this.add.container(VP_X, SCROLL_Y).setDepth(3)
    this.cardBgs = []

    ITEM_REGISTRY.forEach((item, i) => {
      const cx_card = i * (CARD_W + CARD_GAP) + CARD_W / 2
      const cy_card = CARD_H / 2

      const cardBg = this.add
        .image(cx_card, cy_card, this.cardTexture(i))
        .setDisplaySize(CARD_W, CARD_H)
      this.cardBgs.push(cardBg)

      const itemImg = this.add
        .image(cx_card, cy_card, item.iconKey, item.iconFrame)
        .setDisplaySize(IMG_SIZE, IMG_SIZE)

      const nameY = CARD_H + LABEL_OFFSET
      const nameTxt = this.add
        .text(cx_card, nameY, item.name, {
          fontSize: '15px',
          color: '#ffffff',
          fontFamily: FONT_FAMILY,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0)

      const priceY = nameY + LABEL_H + 8
      const coin = this.add
        .image(cx_card - 14, priceY, 'shop-coin')
        .setDisplaySize(20, 20)

      const priceTxt = this.add
        .text(cx_card - 5, priceY, `${item.price}`, {
          fontSize: '15px',
          color: '#ffd700',
          fontFamily: FONT_FAMILY,
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0, 0.5)

      const hit = this.add
        .rectangle(cx_card, CARD_TOTAL_H / 2, CARD_W, CARD_TOTAL_H, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })

      hit.on('pointerdown', () => this.selectItem(item.id))

      this.scrollContainer.add([cardBg, itemImg, nameTxt, coin, priceTxt, hit])
    })

    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(VP_X - 1, SCROLL_Y - 1, VISIBLE_W + 2, VP_H + 2)
    this.scrollContainer.setMask(maskGfx.createGeometryMask())

    // ── Drag-to-scroll ───────────────────────────────────────────────────────
    let dragging = false
    let ptrStartX = 0
    let scrollStartX = 0

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < SCROLL_Y || ptr.y > SCROLL_Y + VP_H) return
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
    const PREV = 128

    const first = ITEM_REGISTRY[0]

    this.previewBg = this.add
      .image(previewX, midY - 18, EquipManager.isEquipped(first.id) ? 'modal-bg3' : 'modal-bg')
      .setDisplaySize(PREV, PREV)
      .setDepth(2)

    this.previewItemImg = this.add
      .image(previewX, midY - 18, first.iconKey, first.iconFrame)
      .setDisplaySize(PREV * 0.7, PREV * 0.7)
      .setDepth(3)

    this.previewLabel = this.add
      .text(previewX, midY - 18 + PREV / 2 + 6, first.name, {
        fontSize: '17px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(2)

    this.previewDesc = this.add
      .text(previewX, midY - 18 + PREV / 2 + 26, first.description, {
        fontSize: '13px',
        color: '#cccccc',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(2)

    const coinPrev = this.add
      .image(previewX - 18, midY - 18 + PREV / 2 + 50, 'shop-coin')
      .setDisplaySize(22, 22)
      .setDepth(2)

    this.previewPriceTxt = this.add
      .text(coinPrev.x + 13, coinPrev.y, `${first.price}`, {
        fontSize: '18px',
        color: '#ffd700',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5)
      .setDepth(2)

    // ── Buy button ───────────────────────────────────────────────────────────
    const buyY = midY - 18 + PREV / 2 + 82

    this.buyBtn = this.add
      .text(previewX, buyY, '', {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#226622',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })

    this.buyBtn.on('pointerdown', () => this.handleBuy())
    this.updateBuyButton()

    // ── Home button ──────────────────────────────────────────────────────────
    const homeY = WORLD.height - 68

    const backBtn = this.add
      .image(cx, homeY, 'btn-home')
      .setDisplaySize(56, 56)
      .setDepth(3)
      .setAlpha(0.85)
      .setInteractive({ useHandCursor: true })

    const labelBack = this.add
      .text(cx, homeY + 20, 'Inicio', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setAlpha(0.85)
      .setInteractive({ cursor: 'pointer' })

    const all: SceneObject[] = [
      title,
      this.scrollContainer,
      playerImg,
      this.previewBg,
      this.previewItemImg,
      this.previewLabel,
      this.previewDesc,
      coinPrev,
      this.previewPriceTxt,
      this.buyBtn,
      backBtn,
      labelBack,
    ]

    const goBack = () => exitTo(this, 'menu-scene', all)
    wireButtonLabel(backBtn, labelBack, goBack)

    all.forEach((obj, i) => dropIn(this, obj, i * 60, 40))
  }

  private cardTexture(idx: number): string {
    if (idx === this.selectedIdx) return 'modal-bg'
    return EquipManager.isEquipped(ITEM_REGISTRY[idx].id) ? 'modal-bg3' : 'modal-bg2'
  }

  private handleBuy() {
    const item = ITEM_REGISTRY[this.selectedIdx]
    if (!item) return
    if (!PurchaseManager.has(item.id)) {
      if (!CoinManager.spend(item.price)) return
      PurchaseManager.buy(item.id)
      this.coinCountText.setText(String(CoinManager.getTotal()))
    }
    EquipManager.equip(item.id)
    this.updateBuyButton()
  }

  private updateBuyButton() {
    const item = ITEM_REGISTRY[this.selectedIdx]
    if (!item) return

    const owned = PurchaseManager.has(item.id)
    const equipped = EquipManager.isEquipped(item.id)
    const canAfford = CoinManager.getTotal() >= item.price

    if (equipped) {
      this.buyBtn
        .setText('Equipado')
        .setStyle({ backgroundColor: '#444444', color: '#aaaaaa' })
        .disableInteractive()
    } else if (owned) {
      this.buyBtn
        .setText('Equipar')
        .setStyle({ backgroundColor: '#226688', color: '#ffffff' })
        .setInteractive({ useHandCursor: true })
    } else if (canAfford) {
      this.buyBtn
        .setText('Comprar')
        .setStyle({ backgroundColor: '#226622', color: '#ffffff' })
        .setInteractive({ useHandCursor: true })
    } else {
      this.buyBtn
        .setText('Sem moedas')
        .setStyle({ backgroundColor: '#662222', color: '#888888' })
        .disableInteractive()
    }

    this.cardBgs.forEach((img, i) => img.setTexture(this.cardTexture(i)))
    this.previewBg.setTexture(equipped ? 'modal-bg3' : 'modal-bg')
  }

  private selectItem(id: string) {
    const idx = ITEM_REGISTRY.findIndex(it => it.id === id)
    if (idx === -1) return
    this.selectedIdx = idx
    const item = ITEM_REGISTRY[idx]

    this.cardBgs.forEach((img, i) => img.setTexture(this.cardTexture(i)))

    this.previewItemImg.setTexture(item.iconKey, item.iconFrame)
    this.previewLabel.setText(item.name)
    this.previewDesc.setText(item.description)
    this.previewPriceTxt.setText(`${item.price}`)
    this.updateBuyButton()
  }
}
