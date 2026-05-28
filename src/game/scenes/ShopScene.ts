import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter } from '../utils/uiHelpers'
import { dropIn, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { CoinManager } from '../utils/CoinManager'
import { PurchaseManager } from '../utils/PurchaseManager'
import { EquipManager } from '../utils/EquipManager'
import { ITEM_REGISTRY } from '../items/registry'

const W  = WORLD.width   // 405
const H  = WORLD.height  // 720
const CX = W / 2         // 202.5

// ── Card rail (bottom strip) ─────────────────────────────────────────────────
const CARD_SZ  = 88
const CARD_GAP = 16
const RAIL_VW  = 3 * CARD_SZ + 2 * CARD_GAP   // 296 px visible width
const RAIL_X0  = Math.floor((W - RAIL_VW) / 2) // 54
const RAIL_TOP = 440                            // top edge of rail cards

// ── Shop preview (large selected-item block) ─────────────────────────────────
const PREV_SZ = 178
const PREV_X  = CX
const PREV_Y  = 210   // center of the block

// ── Inventory layout (player left | item right) ──────────────────────────────
const INV_SZ  = 152
const INV_L_X = Math.round(W * 0.27)  // 109 — player
const INV_R_X = Math.round(W * 0.73)  // 296 — selected item
const INV_CY  = 220

type Showable = { setVisible(v: boolean): unknown }

export class ShopScene extends Phaser.Scene {
  private activeTab: 'shop' | 'inventory' = 'shop'

  private tabShop!: Phaser.GameObjects.Text
  private tabInv!: Phaser.GameObjects.Text

  // ── Shop tab ─────────────────────────────────────────────────────────────
  private shopObjs: Showable[] = []
  private shopRail!: Phaser.GameObjects.Container
  private shopCardBgs: Phaser.GameObjects.Image[] = []
  private shopScrollX   = 0
  private shopMaxScroll = 0
  private shopSelectedIdx = 0

  private shopPreviewBg!:   Phaser.GameObjects.Image
  private shopPreviewImg!:  Phaser.GameObjects.Image
  private shopPreviewName!: Phaser.GameObjects.Text
  private shopPreviewDesc!: Phaser.GameObjects.Text
  private shopCoinIcon!:    Phaser.GameObjects.Image
  private shopPriceTxt!:    Phaser.GameObjects.Text
  private buyBtn!:          Phaser.GameObjects.Text

  // ── Inventory tab ─────────────────────────────────────────────────────────
  private invObjs: Showable[] = []
  private invRail!: Phaser.GameObjects.Container
  private invCardBgs:   Phaser.GameObjects.Image[] = []
  private invCardIcons: Phaser.GameObjects.Image[] = []
  private invCardNames: Phaser.GameObjects.Text[]  = []
  private invScrollX   = 0
  private invMaxScroll = 0

  private invPreviewBg!:   Phaser.GameObjects.Image
  private invPreviewImg!:  Phaser.GameObjects.Image
  private invPreviewName!: Phaser.GameObjects.Text

  private coinCountText!: Phaser.GameObjects.Text

  constructor() { super('shop-scene') }

  // ────────────────────────────────────────────────────────────────────────────
  create() {
    addBackground(this)
    this.coinCountText = addCoinCounter(this)

    // Title
    const title = this.add.text(CX, 50, 'Itens', {
      fontSize: '36px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(2)

    // Tab labels
    this.tabShop = this.add.text(W * 0.28, 90, 'Loja', {
      fontSize: '22px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true })

    this.tabInv = this.add.text(W * 0.72, 90, 'Inventário', {
      fontSize: '22px', color: '#888888',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true })

    this.tabShop.on('pointerdown', () => this.setTab('shop'))
    this.tabInv.on('pointerdown', () => this.setTab('inventory'))

    const divider = this.add
      .rectangle(CX, 108, W - 40, 2, 0x555555)
      .setDepth(2)

    // Build both panels
    this.buildShopPanel()
    this.buildInvPanel()

    // Shared drag-to-scroll (routes to the visible rail)
    let dragging  = false
    let ptrStartX = 0
    let scrollStart = 0

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < RAIL_TOP || ptr.y > RAIL_TOP + CARD_SZ + 52) return
      dragging    = true
      ptrStartX   = ptr.x
      scrollStart = this.activeTab === 'shop' ? this.shopScrollX : this.invScrollX
    })
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!dragging) return
      const delta = ptr.x - ptrStartX
      if (this.activeTab === 'shop') {
        this.shopScrollX = Phaser.Math.Clamp(scrollStart - delta, 0, this.shopMaxScroll)
        this.shopRail.x  = RAIL_X0 - this.shopScrollX
      } else {
        this.invScrollX = Phaser.Math.Clamp(scrollStart - delta, 0, this.invMaxScroll)
        this.invRail.x  = RAIL_X0 - this.invScrollX
      }
    })
    this.input.on('pointerup', () => { dragging = false })

    // Back button
    const homeY   = H - 62
    const backBtn = this.add.image(CX, homeY, 'btn-home')
      .setDisplaySize(52, 52).setDepth(3).setAlpha(0.85)
      .setInteractive({ useHandCursor: true })
    const labelBack = this.add.text(CX, homeY + 18, 'Inicio', {
      fontSize: '15px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(3).setAlpha(0.85).setInteractive({ cursor: 'pointer' })

    const baseObjs: SceneObject[] = [
      title, this.tabShop, this.tabInv, divider, backBtn, labelBack,
    ]
    const goBack = () => exitTo(this, 'menu-scene', baseObjs)
    backBtn.on('pointerdown', goBack)
    labelBack.on('pointerdown', goBack)

    baseObjs.forEach((obj, i) => dropIn(this, obj, i * 50, 40))

    this.setTab('shop')
  }

  // ── Shop panel ───────────────────────────────────────────────────────────────
  private buildShopPanel() {
    const first = ITEM_REGISTRY[0]

    // Large preview block
    this.shopPreviewBg = this.add
      .image(PREV_X, PREV_Y, 'modal-bg')
      .setDisplaySize(PREV_SZ, PREV_SZ).setDepth(2)

    this.shopPreviewImg = this.add
      .image(PREV_X, PREV_Y - 12, first.iconKey, first.iconFrame)
      .setDisplaySize(PREV_SZ * 0.58, PREV_SZ * 0.58).setDepth(3)

    const nameY = PREV_Y + PREV_SZ / 2 + 10
    this.shopPreviewName = this.add.text(PREV_X, nameY, first.name, {
      fontSize: '18px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(2)

    const descY = nameY + 24
    this.shopPreviewDesc = this.add.text(PREV_X, descY, first.description, {
      fontSize: '13px', color: '#cccccc', align: 'center',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(2)

    const priceY = descY + 44
    this.shopCoinIcon = this.add
      .image(PREV_X - 20, priceY, 'shop-coin')
      .setDisplaySize(22, 22).setDepth(2)
    this.shopPriceTxt = this.add.text(PREV_X - 5, priceY, `${first.price}`, {
      fontSize: '18px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(2)

    const btnY = priceY + 36
    this.buyBtn = this.add.text(PREV_X, btnY, '', {
      fontSize: '17px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#226622', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true })
    this.buyBtn.on('pointerdown', () => this.handleBuy())
    this.refreshBuyBtn()

    // Scrollable card rail
    const totalW = ITEM_REGISTRY.length * (CARD_SZ + CARD_GAP) - CARD_GAP
    this.shopMaxScroll = Math.max(0, totalW - RAIL_VW)
    this.shopRail      = this.add.container(RAIL_X0, RAIL_TOP).setDepth(3)
    this.shopCardBgs   = []

    ITEM_REGISTRY.forEach((item, i) => {
      const cx = i * (CARD_SZ + CARD_GAP) + CARD_SZ / 2
      const cy = CARD_SZ / 2

      const bg = this.add
        .image(cx, cy, this.shopCardTex(i))
        .setDisplaySize(CARD_SZ, CARD_SZ)
      this.shopCardBgs.push(bg)

      const icon = this.add
        .image(cx, cy, item.iconKey, item.iconFrame)
        .setDisplaySize(CARD_SZ * 0.65, CARD_SZ * 0.65)

      const nameTxt = this.add.text(cx, CARD_SZ + 7, item.name, {
        fontSize: '13px', color: '#ffffff',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0)

      const coinIco = this.add
        .image(cx - 14, CARD_SZ + 28, 'shop-coin')
        .setDisplaySize(18, 18)
      const priceTxt = this.add.text(cx - 3, CARD_SZ + 28, `${item.price}`, {
        fontSize: '13px', color: '#ffd700',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5)

      const hit = this.add
        .rectangle(cx, cy, CARD_SZ, CARD_SZ, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this.shopSelectItem(i))

      this.shopRail.add([bg, icon, nameTxt, coinIco, priceTxt, hit])
    })

    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(RAIL_X0, RAIL_TOP, RAIL_VW, CARD_SZ + 54)
    this.shopRail.setMask(maskGfx.createGeometryMask())

    this.shopObjs = [
      this.shopPreviewBg, this.shopPreviewImg,
      this.shopPreviewName, this.shopPreviewDesc,
      this.shopCoinIcon, this.shopPriceTxt, this.buyBtn,
    ]
  }

  // ── Inventory panel ──────────────────────────────────────────────────────────
  private buildInvPanel() {
    // Left block — player image
    const playerBg = this.add
      .image(INV_L_X, INV_CY, 'modal-bg3')
      .setDisplaySize(INV_SZ, INV_SZ).setDepth(2)
    const playerImg = this.add
      .image(INV_L_X, INV_CY, 'chinela', 0)
      .setDisplaySize(INV_SZ * 0.78, INV_SZ * 0.78).setDepth(3)

    // Right block — selected item preview
    this.invPreviewBg = this.add
      .image(INV_R_X, INV_CY, 'modal-bg2')
      .setDisplaySize(INV_SZ, INV_SZ).setDepth(2)
    this.invPreviewImg = this.add
      .image(INV_R_X, INV_CY, 'pixel')
      .setDisplaySize(0, 0).setDepth(3)

    const invNameY = INV_CY + INV_SZ / 2 + 10
    this.invPreviewName = this.add.text(INV_R_X, invNameY, '', {
      fontSize: '16px', color: '#ffffff', align: 'center',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(2)

    // Scrollable card rail
    const totalW = ITEM_REGISTRY.length * (CARD_SZ + CARD_GAP) - CARD_GAP
    this.invMaxScroll = Math.max(0, totalW - RAIL_VW)
    this.invRail      = this.add.container(RAIL_X0, RAIL_TOP).setDepth(3)
    this.invCardBgs   = []
    this.invCardIcons = []
    this.invCardNames = []

    ITEM_REGISTRY.forEach((item, i) => {
      const cx    = i * (CARD_SZ + CARD_GAP) + CARD_SZ / 2
      const cy    = CARD_SZ / 2
      const owned = PurchaseManager.has(item.id)

      const bg = this.add
        .image(cx, cy, this.invCardTex(i))
        .setDisplaySize(CARD_SZ, CARD_SZ)
      this.invCardBgs.push(bg)

      const icon = this.add
        .image(cx, cy, item.iconKey, item.iconFrame)
        .setDisplaySize(CARD_SZ * 0.65, CARD_SZ * 0.65)
        .setVisible(owned)
      this.invCardIcons.push(icon)

      const nameTxt = this.add.text(cx, CARD_SZ + 7, item.name, {
        fontSize: '13px', color: '#ffffff',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0).setVisible(owned)
      this.invCardNames.push(nameTxt)

      const hit = this.add
        .rectangle(cx, cy, CARD_SZ, CARD_SZ, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => {
        if (PurchaseManager.has(ITEM_REGISTRY[i].id)) this.invEquipItem(i)
      })

      this.invRail.add([bg, icon, nameTxt, hit])
    })

    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(RAIL_X0, RAIL_TOP, RAIL_VW, CARD_SZ + 36)
    this.invRail.setMask(maskGfx.createGeometryMask())

    this.invObjs = [
      playerBg, playerImg,
      this.invPreviewBg, this.invPreviewImg, this.invPreviewName,
    ]

    // Pre-select equipped item so the preview isn't empty
    const eqId = EquipManager.getEquipped()
    if (eqId) {
      const idx = ITEM_REGISTRY.findIndex(it => it.id === eqId)
      if (idx !== -1) this.invShowPreview(idx)
    }
  }

  // ── Tab switching ────────────────────────────────────────────────────────────
  private setTab(tab: 'shop' | 'inventory') {
    this.activeTab = tab
    const isShop = tab === 'shop'

    this.tabShop.setColor(isShop ? '#ffd700' : '#888888')
    this.tabInv.setColor(isShop ? '#888888' : '#ffd700')

    this.shopObjs.forEach(o => o.setVisible(isShop))
    this.shopRail.setVisible(isShop)

    this.invObjs.forEach(o => o.setVisible(!isShop))
    this.invRail.setVisible(!isShop)

    // Sync inventory cards when switching to that tab
    if (!isShop) this.refreshInvCards()
  }

  // ── Shop helpers ─────────────────────────────────────────────────────────────
  private shopCardTex(idx: number): string {
    if (idx === this.shopSelectedIdx) return 'modal-bg'
    return EquipManager.isEquipped(ITEM_REGISTRY[idx].id) ? 'modal-bg3' : 'modal-bg2'
  }

  private shopSelectItem(idx: number) {
    this.shopSelectedIdx = idx
    const item = ITEM_REGISTRY[idx]
    this.shopCardBgs.forEach((bg, i) => bg.setTexture(this.shopCardTex(i)))
    this.shopPreviewImg.setTexture(item.iconKey, item.iconFrame)
    this.shopPreviewName.setText(item.name)
    this.shopPreviewDesc.setText(item.description)
    this.shopPriceTxt.setText(`${item.price}`)
    this.refreshBuyBtn()
  }

  private handleBuy() {
    const item = ITEM_REGISTRY[this.shopSelectedIdx]
    if (!item) return
    if (!PurchaseManager.has(item.id)) {
      if (!CoinManager.spend(item.price)) return
      PurchaseManager.buy(item.id)
      this.coinCountText.setText(String(CoinManager.getTotal()))
    }
    EquipManager.equip(item.id)
    this.refreshBuyBtn()
  }

  private refreshBuyBtn() {
    const item     = ITEM_REGISTRY[this.shopSelectedIdx]
    if (!item) return
    const owned    = PurchaseManager.has(item.id)
    const equipped = EquipManager.isEquipped(item.id)
    const afford   = CoinManager.getTotal() >= item.price

    this.shopCardBgs.forEach((bg, i) => bg.setTexture(this.shopCardTex(i)))
    this.shopPreviewBg.setTexture(equipped ? 'modal-bg3' : 'modal-bg')

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
    } else if (afford) {
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
  }

  // ── Inventory helpers ────────────────────────────────────────────────────────
  private invCardTex(idx: number): string {
    const item = ITEM_REGISTRY[idx]
    if (EquipManager.isEquipped(item.id)) return 'modal-bg3'
    return PurchaseManager.has(item.id) ? 'modal-bg' : 'modal-bg2'
  }

  private invEquipItem(idx: number) {
    EquipManager.equip(ITEM_REGISTRY[idx].id)
    this.invShowPreview(idx)
    this.refreshInvCards()
    this.refreshBuyBtn()
  }

  private invShowPreview(idx: number) {
    const item     = ITEM_REGISTRY[idx]
    const equipped = EquipManager.isEquipped(item.id)
    this.invPreviewBg.setTexture(equipped ? 'modal-bg3' : 'modal-bg')
    this.invPreviewImg
      .setTexture(item.iconKey, item.iconFrame)
      .setDisplaySize(INV_SZ * 0.62, INV_SZ * 0.62)
    this.invPreviewName.setText(item.name)
  }

  private refreshInvCards() {
    this.invCardBgs.forEach((bg, i) => {
      const owned = PurchaseManager.has(ITEM_REGISTRY[i].id)
      bg.setTexture(this.invCardTex(i))
      this.invCardIcons[i].setVisible(owned)
      this.invCardNames[i].setVisible(owned)
    })
  }
}
