import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter, bindEscapeKey, applySceneMuffle } from '../utils/uiHelpers'
import { playSfx } from '../utils/AudioManager'
import { dropIn, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { CoinManager } from '../utils/CoinManager'
import { PurchaseManager } from '../utils/PurchaseManager'
import { EquipManager } from '../utils/EquipManager'
import { UpgradeManager } from '../utils/UpgradeManager'
import { NotificationManager } from '../utils/NotificationManager'
import { ITEM_REGISTRY } from '../items/registry'
import type { ShopItem } from '../items/types'
import { t } from '../lang'

const W  = WORLD.width   // 405
const H  = WORLD.height  // 720
const CX = W / 2         // 202.5

// ── Card rail (bottom strip) ─────────────────────────────────────────────────
const CARD_SZ    = 88
const CARD_GAP   = 16
const RAIL_VW    = 3 * CARD_SZ + 2 * CARD_GAP   // 296 px visible width
const RAIL_X0    = Math.floor((W - RAIL_VW) / 2) // 54
const RAIL_TOP   = 480                            // top edge of rail cards
const ARROW_Y    = RAIL_TOP + CARD_SZ + 60        // below rail content
const ARROW_SIZE = 92
const ARROW_L_X  = 40
const ARROW_R_X  = W - 40
const SCROLL_STEP = CARD_SZ + CARD_GAP            // one card per click

// ── Shop preview (large selected-item block) ─────────────────────────────────
const PREV_SZ = 160
const PREV_X  = CX
const PREV_Y  = 200   // center of the block

// ── Inventory layout (player left | item right) ──────────────────────────────
const INV_SZ  = 152
const INV_L_X = Math.round(W * 0.27)  // 109 — player
const INV_R_X = Math.round(W * 0.73)  // 296 — selected item
const INV_CY  = 292

const INV_NAME_Y    = INV_CY + INV_SZ / 2 + 10  // 378
const INV_LEVEL_Y   = INV_NAME_Y + 24            // 402
const INV_LSTAT_Y   = INV_LEVEL_Y + 18           // 420

type Showable = { setVisible(v: boolean): unknown }

export class ShopScene extends Phaser.Scene {
  private activeTab: 'shop' | 'inventory' = 'shop'

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
  private shopOwnedTxt!:    Phaser.GameObjects.Text
  private buyBtn!:          Phaser.GameObjects.Container
  private buyBtnBg!:        Phaser.GameObjects.Image
  private buyBtnTxt!:       Phaser.GameObjects.Text
  private shopCardCoinIcons: Phaser.GameObjects.Image[] = []
  private shopCardPriceTxts: Phaser.GameObjects.Text[]  = []
  private shopCardStarTxts:  Phaser.GameObjects.Text[]  = []

  // ── Upgrade UI (inside shop tab, shown for owned items) ──────────────────
  private shopLevelTxt!:      Phaser.GameObjects.Text
  private shopLevelStatTxt!:  Phaser.GameObjects.Text
  private shopLevelNextTxt!:  Phaser.GameObjects.Text
  private shopUpgradeBtnBg!:   Phaser.GameObjects.Image
  private shopUpgradeBtnTxt!:  Phaser.GameObjects.Text
  private shopUpgradeCoinIco!: Phaser.GameObjects.Image
  private shopUpgradeCostTxt!: Phaser.GameObjects.Text
  private shopUpgradeBtn!:     Phaser.GameObjects.Container

  // ── Inventory tab ─────────────────────────────────────────────────────────
  private invPlayerImg!: Phaser.GameObjects.Image
  private blinkTimer?: Phaser.Time.TimerEvent
  private lickTimers: Phaser.Time.TimerEvent[] = []
  private wagTimers: Phaser.Time.TimerEvent[] = []
  private invObjs: Showable[] = []
  private invRail!: Phaser.GameObjects.Container
  private invCardBgs:     Phaser.GameObjects.Image[] = []
  private invCardIcons:   Phaser.GameObjects.Image[] = []
  private invCardNames:   Phaser.GameObjects.Text[]  = []
  private invCardBlocked: Phaser.GameObjects.Image[] = []
  private invCardStarTxts: Phaser.GameObjects.Text[] = []
  private invScrollX   = 0
  private invMaxScroll = 0
  private invSelectedIdx = 0

  private invPreviewBg!:   Phaser.GameObjects.Image
  private invPreviewImg!:  Phaser.GameObjects.Image
  private invPreviewName!: Phaser.GameObjects.Text

  // ── Level display (inside inventory tab, read-only) ──────────────────────
  private invLevelTxt!:      Phaser.GameObjects.Text
  private invLevelStatTxt!:  Phaser.GameObjects.Text

  private invNotifDot!: Phaser.GameObjects.Arc
  private invNotifDotBaseY = 0
  private invNotifBounce?: Phaser.Tweens.Tween

  private coinCounterTxt!: Phaser.GameObjects.Text

  private initialTab: 'shop' | 'inventory' = 'shop'
  private shopTutorial = false
  private tutorialStep: 'buy' | 'equip' | null = null
  private tutorialHintBg?: Phaser.GameObjects.Rectangle
  private tutorialHintTxt?: Phaser.GameObjects.Text
  private tutorialPulse?: Phaser.Tweens.Tween
  private tutorialArrow?: Phaser.GameObjects.Text
  private tutorialArrowTween?: Phaser.Tweens.Tween

  constructor() { super('shop-scene') }

  private playClick() { playSfx(this, 'button-click') }

  init(data: { tab?: 'shop' | 'inventory'; shopTutorial?: boolean }) {
    this.initialTab = data?.tab ?? 'shop'
    this.shopTutorial = data?.shopTutorial ?? false
    this.tutorialStep = this.shopTutorial ? 'buy' : null
  }

  // ────────────────────────────────────────────────────────────────────────────
  create() {
    addBackground(this)
    this.coinCounterTxt = addCoinCounter(this)
    applySceneMuffle(this)

    // Title
    const title = this.add.text(CX, 50, t('shop_title'), {
      fontSize: '36px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(2)

    // Tab labels
    this.tabShop = this.add.text(W * 0.28, 90, t('tab_shop'), {
      fontSize: '22px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true })

    this.tabInv = this.add.text(W * 0.72, 90, t('tab_inventory'), {
      fontSize: '22px', color: '#888888',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true })

    this.tabShop.on('pointerdown', () => { this.playClick(); this.setTab('shop') })
    this.tabInv.on('pointerdown', () => { this.playClick(); this.setTab('inventory') })

    // Notification dot on "Inventário" tab
    const dotX = W * 0.72 + 58
    const dotY  = 82
    this.invNotifDotBaseY = dotY
    this.invNotifDot = this.add.circle(dotX, dotY, 7, 0xff0000).setDepth(4).setScale(0).setVisible(false)
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

    // Footer button — "Início" centered
    const homeY = H - 62

    const backBtn = this.add.image(CX, homeY, 'btn-home')
      .setDisplaySize(52, 52).setDepth(3).setAlpha(0.85)
      .setInteractive({ useHandCursor: true })
    const labelBack = this.add.text(CX, homeY + 18, t('home'), {
      fontSize: '15px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setDepth(3).setAlpha(0.85).setInteractive({ cursor: 'pointer' })

    const baseObjs: SceneObject[] = [
      title, this.tabShop, this.tabInv, divider, backBtn, labelBack,
      this.invNotifDot,
    ]
    const goBack = () => {
      if (this.tutorialStep === 'buy') return
      const panelObjs = this.activeTab === 'shop'
        ? [...this.shopObjs, this.shopRail]
        : [...this.invObjs, this.invRail]
      exitTo(this, 'menu-scene', [...baseObjs, ...panelObjs] as unknown as SceneObject[])
    }
    backBtn.on('pointerdown', () => { this.playClick(); goBack() })
    labelBack.on('pointerdown', () => { this.playClick(); goBack() })
    bindEscapeKey(this, goBack)

    baseObjs.forEach((obj, i) => dropIn(this, obj, i * 50, 40))

    this.setTab(this.initialTab)

    // Entry animation for the initial tab elements
    const initObjs = this.initialTab === 'shop'
      ? [...this.shopObjs, this.shopRail]
      : [...this.invObjs, this.invRail]
    initObjs.forEach((obj, i) => {
      dropIn(this, obj as unknown as SceneObject, 80 + i * 20, 700)
    })

    if (this.shopTutorial) {
      this.time.delayedCall(900, () => this.startTutorialBuyStep())
    }
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
    this.shopPreviewName = this.add.text(PREV_X, nameY, t(`item.${first.id}.name`), {
      fontSize: '18px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(2)

    const descY = nameY + 24
    this.shopPreviewDesc = this.add.text(PREV_X, descY, t(`item.${first.id}.desc`), {
      fontSize: '13px', color: '#cccccc', align: 'center',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(2)

    const priceY = descY + 44
    this.shopPriceTxt = this.add.text(PREV_X - 5, priceY, `${first.price}`, {
      fontSize: '18px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(1, 0.5).setDepth(2)
    this.shopCoinIcon = this.add
      .image(PREV_X + 2, priceY + 1, 'shop-coin')
      .setDisplaySize(22, 22).setDepth(2)
    this.shopOwnedTxt = this.add.text(PREV_X, priceY, t('owned'), {
      fontSize: '16px', color: '#44dd44',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(2).setVisible(false)

    const btnY = priceY + 36
    this.buyBtnBg = this.add.image(0, 0, 'btn-primary').setScale(2)
    this.buyBtnTxt = this.add.text(0, 0, '', {
      fontSize: '14px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)
    this.buyBtn = this.add.container(PREV_X, btnY, [this.buyBtnBg, this.buyBtnTxt])
      .setSize(this.buyBtnBg.width * 2, this.buyBtnBg.height * 2)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
    this.buyBtn.on('pointerdown', () => this.handleBuy())

    // Level + upgrade UI (shown when an owned item has levelStats)
    this.shopLevelTxt = this.add.text(PREV_X, priceY + 10, '', {
      fontSize: '16px', color: '#ffd700', align: 'center',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2).setVisible(false)

    this.shopLevelStatTxt = this.add.text(PREV_X, priceY + 32, '', {
      fontSize: '13px', color: '#cccccc', align: 'left',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(2).setVisible(false)

    this.shopLevelNextTxt = this.add.text(PREV_X, priceY + 32, '', {
      fontSize: '13px', color: '#44dd44', align: 'left',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(2).setVisible(false)

    this.shopUpgradeBtnBg  = this.add.image(0, 0, 'btn-primary').setScale(2)
    this.shopUpgradeBtnTxt = this.add.text(-18, 0, '', {
      fontSize: '14px', color: '#ffffff',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(1, 0.5)
    this.shopUpgradeCoinIco = this.add.image(-10, 1, 'shop-coin').setDisplaySize(20, 20)
    this.shopUpgradeCostTxt = this.add.text(-1, 0, '', {
      fontSize: '14px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0, 0.5)
    this.shopUpgradeBtn = this.add
      .container(PREV_X, btnY + 34, [this.shopUpgradeBtnBg, this.shopUpgradeBtnTxt, this.shopUpgradeCoinIco, this.shopUpgradeCostTxt])
      .setSize(this.shopUpgradeBtnBg.width * 2, this.shopUpgradeBtnBg.height * 2)
      .setDepth(3)
      .setVisible(false)
    this.shopUpgradeBtn.on('pointerdown', () => this.handleUpgrade())

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

      const nameTxt = this.add.text(cx, CARD_SZ + 7, t(`item.${item.id}.name`), {
        fontSize: '13px', color: '#ffffff',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0)

      const owned = PurchaseManager.has(item.id)
      const priceTxt = this.add.text(0, CARD_SZ + 32, `${item.price}`, {
        fontSize: '13px', color: '#ffd700',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5).setVisible(!owned)
      const priceGap = 3
      const priceIconW = 18
      const priceGroupW = priceTxt.width + priceGap + priceIconW
      priceTxt.setX(cx - priceGroupW / 2)
      const coinIco = this.add
        .image(cx - priceGroupW / 2 + priceTxt.width + priceGap + priceIconW / 2, CARD_SZ + 33, 'shop-coin')
        .setDisplaySize(priceIconW, priceIconW)
        .setVisible(!owned)
      this.shopCardCoinIcons.push(coinIco)
      this.shopCardPriceTxts.push(priceTxt)

      const rawLevel = owned ? UpgradeManager.getLevel(item.id) : 0
      const lvl = rawLevel > 0 ? rawLevel : (owned ? 1 : 0)
      const starsStr = (owned && item.levelStats) ? ('★'.repeat(lvl) + '☆'.repeat(3 - lvl)) : ''
      const starTxt = this.add.text(cx, CARD_SZ + 33, starsStr, {
        fontSize: '13px', color: '#ffd700',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0.5).setVisible(owned && !!item.levelStats)
      this.shopCardStarTxts.push(starTxt)

      const hit = this.add
        .rectangle(cx, cy, CARD_SZ, CARD_SZ, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => { this.playClick(); this.shopSelectItem(i) })

      this.shopRail.add([bg, icon, nameTxt, coinIco, priceTxt, starTxt, hit])
    })

    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(RAIL_X0, RAIL_TOP, RAIL_VW, CARD_SZ + 54)
    this.shopRail.setMask(maskGfx.createGeometryMask())

    const shopArrowL = this.add.image(ARROW_L_X, ARROW_Y, 'btn-left')
      .setDisplaySize(ARROW_SIZE, ARROW_SIZE).setDepth(3).setAlpha(0.9)
      .setInteractive({ useHandCursor: true })
    shopArrowL.on('pointerdown', () => {
      this.playClick()
      this.shopScrollX = Phaser.Math.Clamp(this.shopScrollX - SCROLL_STEP, 0, this.shopMaxScroll)
      this.tweens.add({ targets: this.shopRail, x: RAIL_X0 - this.shopScrollX, duration: 160, ease: 'Cubic.Out' })
    })

    const shopArrowR = this.add.image(ARROW_R_X, ARROW_Y, 'btn-right')
      .setDisplaySize(ARROW_SIZE, ARROW_SIZE).setDepth(3).setAlpha(0.9)
      .setInteractive({ useHandCursor: true })
    shopArrowR.on('pointerdown', () => {
      this.playClick()
      this.shopScrollX = Phaser.Math.Clamp(this.shopScrollX + SCROLL_STEP, 0, this.shopMaxScroll)
      this.tweens.add({ targets: this.shopRail, x: RAIL_X0 - this.shopScrollX, duration: 160, ease: 'Cubic.Out' })
    })

    this.shopObjs = [
      this.shopPreviewBg, this.shopPreviewImg,
      this.shopPreviewName, this.shopPreviewDesc,
      this.shopCoinIcon, this.shopPriceTxt, this.shopOwnedTxt, this.buyBtn,
      this.shopLevelTxt, this.shopLevelStatTxt, this.shopLevelNextTxt, this.shopUpgradeBtn,
      shopArrowL, shopArrowR,
    ]
  }

  // ── Inventory panel ──────────────────────────────────────────────────────────
  private buildInvPanel() {
    // Left block — player image
    this.invPlayerImg = this.add
      .image(INV_L_X, INV_CY - 20, 'chinela', 0)
      .setDisplaySize(INV_SZ * 1.1, INV_SZ * 1.1).setDepth(3)
      .setInteractive({ useHandCursor: true })
    this.invPlayerImg.on('pointerdown', () => this.jumpInvPlayer())

    // Right block — selected item preview
    const invSelLabel = this.add.text(INV_R_X, INV_CY - INV_SZ / 2 - 14, t('selected'), {
      fontSize: '14px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(2)

    this.invPreviewBg = this.add
      .image(INV_R_X, INV_CY, 'modal-bg2')
      .setDisplaySize(INV_SZ, INV_SZ).setDepth(2)
    this.invPreviewImg = this.add
      .image(INV_R_X, INV_CY, 'pixel')
      .setDisplaySize(0, 0).setDepth(3)

    this.invPreviewName = this.add.text(INV_R_X, INV_NAME_Y, '', {
      fontSize: '16px', color: '#ffffff', align: 'center',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(2)

    // Level display
    this.invLevelTxt = this.add.text(INV_R_X, INV_LEVEL_Y, '', {
      fontSize: '13px', color: '#ffd700', align: 'center',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(2).setVisible(false)

    this.invLevelStatTxt = this.add.text(INV_R_X, INV_LSTAT_Y, '', {
      fontSize: '12px', color: '#aaaaaa', align: 'center',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(2).setVisible(false)

    // Scrollable card rail
    const totalW = ITEM_REGISTRY.length * (CARD_SZ + CARD_GAP) - CARD_GAP
    this.invMaxScroll = Math.max(0, totalW - RAIL_VW)
    this.invRail      = this.add.container(RAIL_X0, RAIL_TOP).setDepth(3)
    this.invCardBgs      = []
    this.invCardIcons    = []
    this.invCardNames    = []
    this.invCardBlocked  = []
    this.invCardStarTxts = []

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

      const nameTxt = this.add.text(cx, CARD_SZ + 7, t(`item.${item.id}.name`), {
        fontSize: '13px', color: '#ffffff',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0).setVisible(owned)
      this.invCardNames.push(nameTxt)

      const rawLvl = owned ? UpgradeManager.getLevel(item.id) : 0
      const lvl = rawLvl > 0 ? rawLvl : (owned ? 1 : 0)
      const starsStr = (owned && item.levelStats) ? ('★'.repeat(lvl) + '☆'.repeat(3 - lvl)) : ''
      const starTxt = this.add.text(cx, CARD_SZ + 28, starsStr, {
        fontSize: '13px', color: '#ffd700',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0).setVisible(owned && !!item.levelStats)
      this.invCardStarTxts.push(starTxt)

      const hit = this.add
        .rectangle(cx, cy, CARD_SZ, CARD_SZ, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => {
        this.playClick()
        const reg = ITEM_REGISTRY[i]
        if (!!reg.alwaysOwned || PurchaseManager.has(reg.id)) this.invEquipItem(i)
      })

      this.invRail.add([bg, blocked, icon, nameTxt, starTxt, hit])
    })

    const maskGfx = this.make.graphics()
    maskGfx.fillStyle(0xffffff)
    maskGfx.fillRect(RAIL_X0, RAIL_TOP, RAIL_VW, CARD_SZ + 54)
    this.invRail.setMask(maskGfx.createGeometryMask())

    const invArrowL = this.add.image(ARROW_L_X, ARROW_Y, 'btn-left')
      .setDisplaySize(ARROW_SIZE, ARROW_SIZE).setDepth(3).setAlpha(0.9)
      .setInteractive({ useHandCursor: true })
    invArrowL.on('pointerdown', () => {
      this.playClick()
      this.invScrollX = Phaser.Math.Clamp(this.invScrollX - SCROLL_STEP, 0, this.invMaxScroll)
      this.tweens.add({ targets: this.invRail, x: RAIL_X0 - this.invScrollX, duration: 160, ease: 'Cubic.Out' })
    })

    const invArrowR = this.add.image(ARROW_R_X, ARROW_Y, 'btn-right')
      .setDisplaySize(ARROW_SIZE, ARROW_SIZE).setDepth(3).setAlpha(0.9)
      .setInteractive({ useHandCursor: true })
    invArrowR.on('pointerdown', () => {
      this.playClick()
      this.invScrollX = Phaser.Math.Clamp(this.invScrollX + SCROLL_STEP, 0, this.invMaxScroll)
      this.tweens.add({ targets: this.invRail, x: RAIL_X0 - this.invScrollX, duration: 200, ease: 'Cubic.Out' })
    })

    this.invObjs = [
      this.invPlayerImg, invSelLabel,
      this.invPreviewBg, this.invPreviewImg, this.invPreviewName,
      this.invLevelTxt, this.invLevelStatTxt,
      invArrowL, invArrowR,
    ]

    // Default to 'nada' if nothing is equipped yet
    if (!EquipManager.getEquipped()) EquipManager.equip('nada')

    const eqId = EquipManager.getEquipped()!
    const eqIdx = ITEM_REGISTRY.findIndex(it => it.id === eqId)
    const startIdx = eqIdx !== -1 ? eqIdx : 0
    this.invSelectedIdx = startIdx
    this.invShowPreview(startIdx)
  }

  // ── Tab switching ────────────────────────────────────────────────────────────
  private setTab(tab: 'shop' | 'inventory') {
    if (this.tutorialStep === 'buy' && tab === 'inventory') return
    this.activeTab = tab
    const isShop = tab === 'shop'

    this.tabShop.setColor(isShop ? '#ffd700' : '#888888')
    this.tabInv.setColor(isShop ? '#888888' : '#ffd700')

    this.shopObjs.forEach(o => o.setVisible(isShop))
    this.shopRail.setVisible(isShop)

    this.invObjs.forEach(o => o.setVisible(!isShop))
    this.invRail.setVisible(!isShop)

    if (isShop) {
      this.stopBlinkLoop()
      this.refreshBuyBtn()
    } else {
      this.shopOwnedTxt.setVisible(false)
      this.refreshInvCards()
      this.refreshInvLevel()
      NotificationManager.clearNewItem()
      this.hideInvNotifDot()
      if (this.tutorialStep === 'equip') this.startTutorialInvItemStep()
      this.startBlinkLoop()
    }
  }

  // ── Shop helpers ─────────────────────────────────────────────────────────────
  private shopCardTex(idx: number): string {
    if (idx === this.shopSelectedIdx) return 'modal-bg'
    return 'modal-bg2'
  }

  private shopSelectItem(idx: number) {
    if (this.tutorialStep === 'buy' && idx !== 0) return
    this.shopSelectedIdx = idx
    const item = this.shopItems[idx]
    this.shopCardBgs.forEach((bg, i) => bg.setTexture(this.shopCardTex(i)))
    this.shopPreviewImg.setTexture(item.iconKey, item.iconFrame)
    this.shopPreviewName.setText(t(`item.${item.id}.name`))
    this.shopPreviewDesc.setText(t(`item.${item.id}.desc`))
    this.shopPriceTxt.setText(`${item.price}`)
    this.refreshBuyBtn()
    this.centerRailOnIndex(idx, 'shop')
  }

  private handleBuy() {
    const item = this.shopItems[this.shopSelectedIdx]
    if (!item) return
    if (this.tutorialStep === 'buy' && item.id !== 'pomodoro-shot') return
    if (PurchaseManager.has(item.id)) return
    if (!CoinManager.spend(item.price)) return
    PurchaseManager.buy(item.id)
    if (item.levelStats) UpgradeManager.setLevel(item.id, 1)
    playSfx(this, 'coin-spend', 0.7)
    NotificationManager.setNewItem()
    this.showInvNotifDot()
    this.shopCardCoinIcons[this.shopSelectedIdx]?.setVisible(false)
    this.shopCardPriceTxts[this.shopSelectedIdx]?.setVisible(false)
    this.coinCounterTxt.setText(String(CoinManager.getTotal()))
    this.refreshBuyBtn()

    if (this.tutorialStep === 'buy' && item.id === 'pomodoro-shot') {
      this.time.delayedCall(600, () => this.startTutorialEquipStep())
    }
  }

  private refreshBuyBtn() {
    const item     = this.shopItems[this.shopSelectedIdx]
    if (!item) return
    const owned  = PurchaseManager.has(item.id)
    const afford = CoinManager.getTotal() >= item.price

    this.shopCardBgs.forEach((bg, i) => bg.setTexture(this.shopCardTex(i)))
    this.shopPreviewBg.setTexture('modal-bg')
    this.refreshShopCardStars()

    if (owned) {
      this.buyBtn.setVisible(false)
      this.shopCoinIcon.setVisible(false)
      this.shopPriceTxt.setVisible(false)
      if (item.levelStats) {
        this.shopOwnedTxt.setVisible(false)
        this.refreshShopUpgrade(item)
      } else {
        this.shopOwnedTxt.setVisible(true)
        this.hideShopUpgrade()
      }
    } else {
      this.shopOwnedTxt.setVisible(false)
      this.hideShopUpgrade()
      this.buyBtn.setVisible(true)
      this.shopCoinIcon.setVisible(true)
      this.shopPriceTxt.setVisible(true)
      if (afford) {
        this.buyBtnBg.setTexture('btn-primary')
        this.buyBtnTxt.setText(t('buy')).setColor('#ffffff')
        this.buyBtn.setInteractive({ useHandCursor: true })
      } else {
        this.buyBtnBg.setTexture('btn-blocked')
        this.buyBtnTxt.setText(t('no_coins')).setColor('#888888')
        this.buyBtn.disableInteractive()
      }
    }
  }

  // ── Shop upgrade helpers ─────────────────────────────────────────────────────
  private refreshShopUpgrade(item: ShopItem) {
    if (!item.levelStats) { this.hideShopUpgrade(); return }

    const rawLevel = UpgradeManager.getLevel(item.id)
    const level = rawLevel > 0 ? rawLevel : 1

    const stars = '★'.repeat(level) + '☆'.repeat(3 - level)
    this.shopLevelTxt.setText(t('level', level, stars)).setVisible(true)

    if (level >= 3) {
      // Max level — show the current stat centered, no upgrade preview.
      this.shopLevelStatTxt.setText(t(`item.${item.id}.stat.${level - 1}`)).setVisible(true)
      this.shopLevelNextTxt.setVisible(false)
      this.layoutLevelStat(false)

      this.shopUpgradeBtnBg.setTexture('btn-blocked')
      this.shopUpgradeBtnTxt.setText(t('max_level')).setColor('#888888').setOrigin(0.5, 0.5).setX(0)
      this.shopUpgradeCoinIco.setAlpha(0)
      this.shopUpgradeCostTxt.setText('')
      this.shopUpgradeBtn.setVisible(true).disableInteractive()
    } else {
      const nextStatDesc = t(`item.${item.id}.stat.${level}`)
      const nextVal = nextStatDesc.split(': ')[1] ?? nextStatDesc
      this.shopLevelStatTxt.setText(t(`item.${item.id}.stat.${level - 1}`)).setVisible(true)
      this.shopLevelNextTxt.setText(`  →  ${nextVal}`).setVisible(true)
      this.layoutLevelStat(true)

      const cost   = item.levelStats[level].upgradeCost
      const afford = CoinManager.getTotal() >= cost
      this.shopUpgradeBtnTxt.setOrigin(0, 0.5).setText(t('upgrade'))
      this.shopUpgradeCostTxt.setOrigin(0, 0.5).setText(`${cost}`)
      this.layoutUpgradeBtn()
      if (afford) {
        this.shopUpgradeBtnBg.setTexture('btn-primary')
        this.shopUpgradeBtnTxt.setColor('#ffffff')
        this.shopUpgradeCoinIco.setAlpha(1)
        this.shopUpgradeCostTxt.setColor('#ffd700')
        this.shopUpgradeBtn.setVisible(true).setInteractive({ useHandCursor: true })
      } else {
        this.shopUpgradeBtnBg.setTexture('btn-blocked')
        this.shopUpgradeBtnTxt.setColor('#888888')
        this.shopUpgradeCoinIco.setAlpha(0.8)
        this.shopUpgradeCostTxt.setColor('#888888')
        this.shopUpgradeBtn.setVisible(true).disableInteractive()
      }
    }
  }

  private refreshShopCardStars() {
    this.shopItems.forEach((item, i) => {
      const owned = PurchaseManager.has(item.id)
      const starTxt = this.shopCardStarTxts[i]
      if (!starTxt) return
      if (owned && item.levelStats) {
        const raw = UpgradeManager.getLevel(item.id)
        const lvl = raw > 0 ? raw : 1
        starTxt.setText('★'.repeat(lvl) + '☆'.repeat(3 - lvl)).setVisible(true)
      } else {
        starTxt.setVisible(false)
      }
    })
  }

  private hideShopUpgrade() {
    this.shopLevelTxt.setVisible(false)
    this.shopLevelStatTxt.setVisible(false)
    this.shopLevelNextTxt.setVisible(false)
    this.shopUpgradeBtn.setVisible(false)
  }

  private layoutUpgradeBtn() {
    const gap = 5
    const iconW = 16
    const totalW = this.shopUpgradeBtnTxt.width + gap + this.shopUpgradeCostTxt.width + gap + iconW
    const startX = -totalW / 2
    this.shopUpgradeBtnTxt.setX(startX)
    this.shopUpgradeCostTxt.setX(startX + this.shopUpgradeBtnTxt.width + gap)
    this.shopUpgradeCoinIco.setX(startX + this.shopUpgradeBtnTxt.width + gap + this.shopUpgradeCostTxt.width - 2 + iconW / 2)
  }

  // Both stat texts use origin (0, 0.5); center them as a group around PREV_X.
  private layoutLevelStat(withNext: boolean) {
    const totalW = this.shopLevelStatTxt.width + (withNext ? this.shopLevelNextTxt.width : 0)
    const startX = PREV_X - totalW / 2
    this.shopLevelStatTxt.setX(startX)
    this.shopLevelNextTxt.setX(startX + this.shopLevelStatTxt.width)
  }

  private handleUpgrade() {
    const item = this.shopItems[this.shopSelectedIdx]
    if (!item?.levelStats) return
    if (!PurchaseManager.has(item.id)) return
    const rawLevel = UpgradeManager.getLevel(item.id)
    const level = rawLevel > 0 ? rawLevel : 1
    if (level >= 3) return
    const cost = item.levelStats[level].upgradeCost
    if (!CoinManager.spend(cost)) return
    UpgradeManager.setLevel(item.id, level + 1)
    playSfx(this, 'coin-spend', 0.7)
    this.coinCounterTxt.setText(String(CoinManager.getTotal()))
    this.refreshBuyBtn()
  }

  // ── Inventory helpers ────────────────────────────────────────────────────────
  private invCardTex(idx: number): string {
    const item = ITEM_REGISTRY[idx]
    if (EquipManager.isEquipped(item.id)) return 'modal-bg3'
    return PurchaseManager.has(item.id) ? 'modal-bg' : 'modal-bg2'
  }

  private invEquipItem(idx: number) {
    this.invSelectedIdx = idx
    EquipManager.equip(ITEM_REGISTRY[idx].id)
    this.invShowPreview(idx)
    this.refreshInvCards()
    this.jumpInvPreview()
    this.centerRailOnIndex(idx, 'inventory')

    if (this.tutorialStep === 'equip' && ITEM_REGISTRY[idx].id === 'pomodoro-shot') {
      this.tutorialStep = null
      this.completeTutorial()
    }
  }

  private jumpInvPlayer() {
    const baseY = INV_CY - 20
    this.tweens.add({
      targets: this.invPlayerImg,
      y: baseY - 30,
      duration: 130,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.tweens.add({
          targets: this.invPlayerImg,
          y: baseY,
          duration: 200,
          ease: 'Bounce.Out',
        })
      },
    })
    const miados = [1, 3, 4]
    const key = `miado${miados[Phaser.Math.Between(0, miados.length - 1)]}`
    playSfx(this, key, 0.7)
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
    this.invPreviewName.setText(t(`item.${item.id}.name`))
    this.refreshInvLevel()
  }

  // ── Inventory level display (read-only; upgrades happen in the shop) ──────────
  private refreshInvLevel() {
    const item = ITEM_REGISTRY[this.invSelectedIdx]
    if (!item || !item.levelStats || item.alwaysOwned || !PurchaseManager.has(item.id)) {
      this.invLevelTxt.setVisible(false)
      this.invLevelStatTxt.setVisible(false)
      return
    }

    const rawLevel = UpgradeManager.getLevel(item.id)
    const level = rawLevel > 0 ? rawLevel : 1

    const stars = '★'.repeat(level) + '☆'.repeat(3 - level)
    this.invLevelTxt.setText(t('level', level, stars)).setVisible(true)
    this.invLevelStatTxt.setText(t(`item.${item.id}.stat.${level - 1}`)).setVisible(true)
  }

  private refreshInvCards() {
    this.invCardBgs.forEach((bg, i) => {
      const item  = ITEM_REGISTRY[i]
      const owned = !!item.alwaysOwned || PurchaseManager.has(item.id)
      bg.setTexture(this.invCardTex(i))
      this.invCardBlocked[i].setVisible(!owned)
      this.invCardIcons[i].setVisible(owned)
      this.invCardNames[i].setVisible(owned)
      const starTxt = this.invCardStarTxts[i]
      if (starTxt) {
        if (owned && item.levelStats) {
          const raw = UpgradeManager.getLevel(item.id)
          const lvl = raw > 0 ? raw : 1
          starTxt.setText('★'.repeat(lvl) + '☆'.repeat(3 - lvl)).setVisible(true)
        } else {
          starTxt.setVisible(false)
        }
      }
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

  private startBlinkLoop() {
    this.scheduleNextBlink()
  }

  private scheduleNextBlink() {
    const delay = Phaser.Math.Between(2000, 5000)
    this.blinkTimer = this.time.delayedCall(delay, () => {
      if (!this.invPlayerImg.visible) return
      const roll = Math.random()
      if (roll < 0.35) {
        this.playLickAnimation()
      } else if (roll < 0.60) {
        this.playWagAnimation()
      } else {
        this.invPlayerImg.setFrame(5)
        this.time.delayedCall(500, () => {
          this.invPlayerImg.setFrame(0)
          this.scheduleNextBlink()
        })
      }
    })
  }

  private playLickAnimation() {
    const lickFrames = [6, 7, 8, 7, 8, 7, 8, 6, 0]
    const lickDelays = [200, 180, 180, 180, 180, 180, 180, 200, 0]
    let accumulated = 0
    lickFrames.forEach((frame, i) => {
      const t = this.time.delayedCall(accumulated, () => {
        if (!this.invPlayerImg.visible) return
        this.invPlayerImg.setFrame(frame)
        if (i === lickFrames.length - 1) this.scheduleNextBlink()
      })
      this.lickTimers.push(t)
      accumulated += lickDelays[i]
    })
  }

  private playWagAnimation() {
    const wagFrames = [9, 0, 9, 0, 9, 0]
    const wagDelays = [280, 200, 280, 200, 280, 0]
    let accumulated = 0
    wagFrames.forEach((frame, i) => {
      const t = this.time.delayedCall(accumulated, () => {
        if (!this.invPlayerImg.visible) return
        this.invPlayerImg.setFrame(frame)
        if (i === wagFrames.length - 1) this.scheduleNextBlink()
      })
      this.wagTimers.push(t)
      accumulated += wagDelays[i]
    })
  }

  private stopBlinkLoop() {
    this.blinkTimer?.remove()
    this.blinkTimer = undefined
    this.lickTimers.forEach(t => t.remove())
    this.lickTimers = []
    this.wagTimers.forEach(t => t.remove())
    this.wagTimers = []
    this.invPlayerImg?.setFrame(0)
  }

  private centerRailOnIndex(idx: number, tab: 'shop' | 'inventory') {
    const cardCenter = idx * (CARD_SZ + CARD_GAP) + CARD_SZ / 2
    const targetScrollX = Phaser.Math.Clamp(
      cardCenter - RAIL_VW / 2,
      0,
      tab === 'shop' ? this.shopMaxScroll : this.invMaxScroll,
    )
    if (tab === 'shop') {
      this.shopScrollX = targetScrollX
      this.tweens.add({ targets: this.shopRail, x: RAIL_X0 - targetScrollX, duration: 200, ease: 'Cubic.Out' })
    } else {
      this.invScrollX = targetScrollX
      this.tweens.add({ targets: this.invRail, x: RAIL_X0 - targetScrollX, duration: 200, ease: 'Cubic.Out' })
    }
  }

  // ── Shop tutorial ────────────────────────────────────────────────────────────
  private setTutorialHint(text: string) {
    if (this.tutorialHintTxt) {
      this.tutorialHintTxt.setText(text)
      return
    }
    const panelW = W - 32
    const panelY = H - 120
    this.tutorialHintBg = this.add
      .rectangle(CX, panelY, panelW, 52, 0x000000, 0.82)
      .setStrokeStyle(2, 0xffd700, 1)
      .setDepth(50)
      .setAlpha(0)
    this.tutorialHintTxt = this.add
      .text(CX, panelY, text, {
        fontSize: '15px', color: '#ffd700', align: 'center',
        fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 3,
        lineSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(51)
      .setAlpha(0)

    this.tweens.add({ targets: [this.tutorialHintBg, this.tutorialHintTxt], alpha: 1, duration: 350 })
  }

  private showTutorialArrow(x: number, y: number, pointUp: boolean) {
    this.hideTutorialArrow()
    const symbol = pointUp ? '▲' : '▼'
    this.tutorialArrow = this.add.text(x, y, symbol, {
      fontSize: '28px', color: '#ffd700',
      fontFamily: FONT_FAMILY, stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(52).setAlpha(0)
    this.tweens.add({ targets: this.tutorialArrow, alpha: 1, duration: 300 })
    this.tutorialArrowTween = this.tweens.add({
      targets: this.tutorialArrow,
      y: y + (pointUp ? -10 : 10),
      duration: 480,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
      delay: 300,
    })
  }

  private hideTutorialArrow() {
    if (!this.tutorialArrow) return
    this.tutorialArrowTween?.stop()
    this.tutorialArrowTween = undefined
    const arrow = this.tutorialArrow
    this.tutorialArrow = undefined
    this.tweens.add({ targets: arrow, alpha: 0, duration: 200, onComplete: () => arrow.destroy() })
  }

  private startTutorialBuyStep() {
    if (this.tutorialStep !== 'buy') return
    this.shopSelectItem(0)
    this.setTutorialHint(t('tutorial_buy'))
    this.showTutorialArrow(this.buyBtn.x, this.buyBtn.y - 34, false)
    this.tutorialPulse = this.tweens.add({
      targets: this.buyBtn,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 500,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    })
  }

  private startTutorialEquipStep() {
    this.tutorialStep = 'equip'
    this.tutorialPulse?.stop()
    this.tutorialPulse = undefined
    this.buyBtn.setScale(1)
    this.setTutorialHint(t('tutorial_equip'))
    this.showTutorialArrow(Math.round(W * 0.72), 114, true)
  }

  private startTutorialInvItemStep() {
    const pomIdx = ITEM_REGISTRY.findIndex(it => it.id === 'pomodoro-shot')
    if (pomIdx === -1) return
    const cardX = RAIL_X0 + pomIdx * (CARD_SZ + CARD_GAP) + CARD_SZ / 2
    this.showTutorialArrow(cardX, RAIL_TOP - 20, false)
  }

  private completeTutorial() {
    this.tutorialPulse?.stop()
    this.tutorialPulse = undefined
    this.hideTutorialArrow()
    if (!this.tutorialHintTxt) return
    this.tutorialHintTxt
      .setText(t('tutorial_done'))
      .setColor('#00ff88')
    this.time.delayedCall(2000, () => {
      const targets = [this.tutorialHintBg, this.tutorialHintTxt].filter(Boolean)
      this.tweens.add({
        targets,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.tutorialHintBg?.destroy()
          this.tutorialHintTxt?.destroy()
          this.tutorialHintBg = undefined
          this.tutorialHintTxt = undefined
        },
      })
    })
  }
}
