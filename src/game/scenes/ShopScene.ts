import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter } from '../utils/uiHelpers'
import { dropIn, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { CoinManager } from '../utils/CoinManager'
import { PurchaseManager } from '../utils/PurchaseManager'
import { EquipManager } from '../utils/EquipManager'
import { NotificationManager } from '../utils/NotificationManager'
import { ITEM_REGISTRY } from '../items/registry'
import type { ShopItem } from '../items/types'

const W  = WORLD.width   // 405
const H  = WORLD.height  // 720
const CX = W / 2         // 202.5

// ── Card rail (bottom strip) ─────────────────────────────────────────────────
const CARD_SZ  = 88
const CARD_GAP = 16
const RAIL_VW  = 3 * CARD_SZ + 2 * CARD_GAP   // 296 px visible width
const RAIL_X0  = Math.floor((W - RAIL_VW) / 2) // 54
const RAIL_TOP = 480                            // top edge of rail cards

// ── Shop preview (large selected-item block) ─────────────────────────────────
const PREV_SZ = 178
const PREV_X  = CX
const PREV_Y  = 228   // center of the block

// ── Inventory layout (player left | item right) ──────────────────────────────
const INV_SZ  = 152
const INV_L_X = Math.round(W * 0.27)  // 109 — player
const INV_R_X = Math.round(W * 0.73)  // 296 — selected item
const INV_CY  = 292

type Showable = { setVisible(v: boolean): unknown }
type AnimObj  = Phaser.GameObjects.GameObject & { y: number; alpha: number; displayHeight?: number }

export class ShopScene extends Phaser.Scene {
  private activeTab: 'shop' | 'inventory' = 'shop'
  private tabInitialized = false

  private tabShop!: Phaser.GameObjects.Text
  private tabInv!: Phaser.GameObjects.Text

  // ── Shop tab ─────────────────────────────────────────────────────────────
  private shopItems: ShopItem[] = []
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
  private buyBtn!:          Phaser.GameObjects.Container
  private buyBtnBg!:        Phaser.GameObjects.Image
  private buyBtnTxt!:       Phaser.GameObjects.Text
  private shopCardCoinIcons: Phaser.GameObjects.Image[] = []
  private shopCardPriceTxts: Phaser.GameObjects.Text[]  = []

  // ── Inventory tab ─────────────────────────────────────────────────────────
  private invObjs: Showable[] = []
  private invRail!: Phaser.GameObjects.Container
  private invCardBgs:     Phaser.GameObjects.Image[] = []
  private invCardIcons:   Phaser.GameObjects.Image[] = []
  private invCardNames:   Phaser.GameObjects.Text[]  = []
  private invCardBlocked: Phaser.GameObjects.Image[] = []
  private invScrollX   = 0
  private invMaxScroll = 0

  private invPreviewBg!:   Phaser.GameObjects.Image
  private invPreviewImg!:  Phaser.GameObjects.Image
  private invPreviewName!: Phaser.GameObjects.Text

  private coinCountText!: Phaser.GameObjects.Text
  private invNotifDot!: Phaser.GameObjects.Arc
  private invNotifDotBaseY = 0
  private invNotifBounce?: Phaser.Tweens.Tween

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

    // Notification dot on "Inventário" tab
    const dotX = W * 0.72 + 58
    const dotY  = 82
    this.invNotifDotBaseY = dotY
    this.invNotifDot = this.add.circle(dotX, dotY, 7, 0xff7700).setDepth(4).setScale(0).setVisible(false)
    if (NotificationManager.hasNewItem()) this.showInvNotifDot()

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
      this.invNotifDot,
    ]
    const goBack = () => {
      const panelObjs = this.activeTab === 'shop'
        ? [...this.shopObjs, this.shopRail]
        : [...this.invObjs, this.invRail]
      exitTo(this, 'menu-scene', [...baseObjs, ...panelObjs] as unknown as SceneObject[])
    }
    backBtn.on('pointerdown', goBack)
    labelBack.on('pointerdown', goBack)

    baseObjs.forEach((obj, i) => dropIn(this, obj, i * 50, 40))

    this.setTab('shop')

    // Entry animation for the default (shop) tab elements
    ;[...this.shopObjs, this.shopRail].forEach((obj, i) => {
      dropIn(this, obj as unknown as SceneObject, 80 + i * 20, 700)
    })
  }

  // ── Shop panel ───────────────────────────────────────────────────────────────
  private buildShopPanel() {
    this.shopItems   = ITEM_REGISTRY.filter(i => !i.inventoryOnly)
    this.shopCardBgs = []
    const first = this.shopItems[0]

    // Large preview block
    this.shopPreviewBg = this.add
      .image(PREV_X, PREV_Y, 'modal-bg')
      .setDisplaySize(PREV_SZ, PREV_SZ).setDepth(2)

    this.shopPreviewImg = this.add
      .image(PREV_X, PREV_Y - 12, first.iconKey, first.iconFrame)
      .setDisplaySize(PREV_SZ * 0.58, PREV_SZ * 0.58).setDepth(3)

    const nameY = PREV_Y + PREV_SZ / 2 + 12
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
    this.buyBtnBg = this.add.image(0, 0, 'btn-primary')
    this.buyBtnTxt = this.add.text(0, 0, '', {
      fontSize: '14px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)
    this.buyBtn = this.add.container(PREV_X, btnY, [this.buyBtnBg, this.buyBtnTxt])
      .setSize(this.buyBtnBg.width, this.buyBtnBg.height)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
    this.buyBtn.on('pointerdown', () => this.handleBuy())
    this.refreshBuyBtn()

    // Scrollable card rail
    const totalW = this.shopItems.length * (CARD_SZ + CARD_GAP) - CARD_GAP
    this.shopMaxScroll = Math.max(0, totalW - RAIL_VW)
    this.shopRail      = this.add.container(RAIL_X0, RAIL_TOP).setDepth(3)
    this.shopCardBgs   = []

    this.shopItems.forEach((item, i) => {
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

      const owned = PurchaseManager.has(item.id)
      const coinIco = this.add
        .image(cx - 14, CARD_SZ + 28, 'shop-coin')
        .setDisplaySize(18, 18)
        .setVisible(!owned)
      const priceTxt = this.add.text(cx - 3, CARD_SZ + 28, `${item.price}`, {
        fontSize: '13px', color: '#ffd700',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5).setVisible(!owned)
      this.shopCardCoinIcons.push(coinIco)
      this.shopCardPriceTxts.push(priceTxt)

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
    const playerImg = this.add
      .image(INV_L_X, INV_CY - 20, 'chinela', 0)
      .setDisplaySize(INV_SZ * 1.1, INV_SZ * 1.1).setDepth(3)

    // Right block — selected item preview
    const invSelLabel = this.add.text(INV_R_X, INV_CY - INV_SZ / 2 - 14, 'Selecionado', {
      fontSize: '14px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(2)

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
    this.invCardBgs     = []
    this.invCardIcons   = []
    this.invCardNames   = []
    this.invCardBlocked = []

    ITEM_REGISTRY.forEach((item, i) => {
      const cx    = i * (CARD_SZ + CARD_GAP) + CARD_SZ / 2
      const cy    = CARD_SZ / 2
      const owned = !!item.alwaysOwned || PurchaseManager.has(item.id)

      const bg = this.add
        .image(cx, cy, this.invCardTex(i))
        .setDisplaySize(CARD_SZ, CARD_SZ)
      this.invCardBgs.push(bg)

      const blocked = this.add
        .image(cx, cy, 'shop-blocked')
        .setDisplaySize(CARD_SZ * 0.55, CARD_SZ * 0.55)
        .setVisible(!owned)
      this.invCardBlocked.push(blocked)

      const iconSz = item.alwaysOwned ? 0 : CARD_SZ * 0.65
      const icon = this.add
        .image(cx, cy, item.iconKey, item.iconFrame)
        .setDisplaySize(iconSz, iconSz)
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
        const reg = ITEM_REGISTRY[i]
        if (!!reg.alwaysOwned || PurchaseManager.has(reg.id)) this.invEquipItem(i)
      })

      this.invRail.add([bg, blocked, icon, nameTxt, hit])
    })

    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(RAIL_X0, RAIL_TOP, RAIL_VW, CARD_SZ + 36)
    this.invRail.setMask(maskGfx.createGeometryMask())

    this.invObjs = [
      playerImg, invSelLabel,
      this.invPreviewBg, this.invPreviewImg, this.invPreviewName,
    ]

    // Default to 'nada' if nothing is equipped yet
    if (!EquipManager.getEquipped()) EquipManager.equip('nada')

    const eqId = EquipManager.getEquipped()!
    const eqIdx = ITEM_REGISTRY.findIndex(it => it.id === eqId)
    this.invShowPreview(eqIdx !== -1 ? eqIdx : 0)
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

    if (isShop) {
      this.refreshBuyBtn()
    } else {
      this.refreshInvCards()
      NotificationManager.clearNewItem()
      this.hideInvNotifDot()
    }
  }

  // ── Shop helpers ─────────────────────────────────────────────────────────────
  private shopCardTex(idx: number): string {
    if (idx === this.shopSelectedIdx) return 'modal-bg'
    return 'modal-bg2'
  }

  private shopSelectItem(idx: number) {
    this.shopSelectedIdx = idx
    const item = this.shopItems[idx]
    this.shopCardBgs.forEach((bg, i) => bg.setTexture(this.shopCardTex(i)))
    this.shopPreviewImg.setTexture(item.iconKey, item.iconFrame)
    this.shopPreviewName.setText(item.name)
    this.shopPreviewDesc.setText(item.description)
    this.shopPriceTxt.setText(`${item.price}`)
    this.refreshBuyBtn()
  }

  private handleBuy() {
    const item = this.shopItems[this.shopSelectedIdx]
    if (!item) return
    if (PurchaseManager.has(item.id)) return
    if (!CoinManager.spend(item.price)) return
    PurchaseManager.buy(item.id)
    NotificationManager.setNewItem()
    this.showInvNotifDot()
    this.coinCountText.setText(String(CoinManager.getTotal()))
    this.shopCardCoinIcons[this.shopSelectedIdx]?.setVisible(false)
    this.shopCardPriceTxts[this.shopSelectedIdx]?.setVisible(false)
    this.refreshBuyBtn()
  }

  private refreshBuyBtn() {
    const item     = this.shopItems[this.shopSelectedIdx]
    if (!item) return
    const owned  = PurchaseManager.has(item.id)
    const afford = CoinManager.getTotal() >= item.price

    this.shopCardBgs.forEach((bg, i) => bg.setTexture(this.shopCardTex(i)))
    this.shopPreviewBg.setTexture('modal-bg')

    if (owned) {
      this.buyBtn.setVisible(false)
      this.shopCoinIcon.setVisible(false)
      this.shopPriceTxt.setVisible(false)
    } else {
      this.buyBtn.setVisible(true)
      this.shopCoinIcon.setVisible(true)
      this.shopPriceTxt.setVisible(true)
      if (afford) {
        this.buyBtnBg.setTexture('btn-primary')
        this.buyBtnTxt.setText('Comprar').setColor('#ffffff')
        this.buyBtn.setInteractive({ useHandCursor: true })
      } else {
        this.buyBtnBg.setTexture('btn-blocked')
        this.buyBtnTxt.setText('Sem moedas').setColor('#888888')
        this.buyBtn.disableInteractive()
      }
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
    this.jumpInvPreview()
  }

  private jumpInvPreview() {
    const baseY = INV_CY
    this.tweens.add({
      targets: this.invPreviewImg,
      y: baseY - 28,
      duration: 140,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.tweens.add({
          targets: this.invPreviewImg,
          y: baseY,
          duration: 180,
          ease: 'Bounce.Out',
        })
      },
    })
  }

  private invShowPreview(idx: number) {
    const item     = ITEM_REGISTRY[idx]
    const equipped = EquipManager.isEquipped(item.id)
    this.invPreviewBg.setTexture(equipped ? 'modal-bg3' : 'modal-bg')
    if (item.alwaysOwned) {
      this.invPreviewImg.setDisplaySize(0, 0)
    } else {
      this.invPreviewImg
        .setTexture(item.iconKey, item.iconFrame)
        .setDisplaySize(INV_SZ * 0.62, INV_SZ * 0.62)
    }
    this.invPreviewName.setText(item.name)
  }

  private refreshInvCards() {
    this.invCardBgs.forEach((bg, i) => {
      const item  = ITEM_REGISTRY[i]
      const owned = !!item.alwaysOwned || PurchaseManager.has(item.id)
      bg.setTexture(this.invCardTex(i))
      this.invCardBlocked[i].setVisible(!owned)
      this.invCardIcons[i].setVisible(owned)
      this.invCardNames[i].setVisible(owned)
    })
  }

  private showInvNotifDot() {
    if (this.invNotifDot.visible) return
    this.invNotifDot.y = this.invNotifDotBaseY
    this.invNotifDot.setScale(0).setVisible(true)
    this.tweens.add({
      targets: this.invNotifDot,
      scale: 1,
      duration: 320,
      ease: 'Back.Out',
      onComplete: () => {
        this.invNotifBounce = this.tweens.add({
          targets: this.invNotifDot,
          scale: 1.45,
          duration: 600,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1,
        })
      },
    })
  }

  private hideInvNotifDot() {
    if (!this.invNotifDot.visible) return
    this.invNotifBounce?.stop()
    this.invNotifBounce = undefined
    this.tweens.add({
      targets: this.invNotifDot,
      scale: 0,
      duration: 220,
      ease: 'Back.In',
      onComplete: () => {
        this.invNotifDot.setVisible(false).setScale(1)
      },
    })
  }
}
