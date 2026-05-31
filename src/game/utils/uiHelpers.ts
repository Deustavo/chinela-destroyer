import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { CoinManager } from './CoinManager'
import type { MusicScene } from '../scenes/MusicScene'

const BTN_HOVER_DELTA = 0.12

/**
 * Add the standard full-screen background image at depth 0.
 * Returns the image so the caller can include it in animation arrays if needed.
 */
export function addBackground(scene: Phaser.Scene): Phaser.GameObjects.Image {
  const cx = WORLD.width / 2
  const cy = WORLD.height / 2
  return scene.add
    .image(cx, cy, 'bg')
    .setDisplaySize(WORLD.width, WORLD.height)
    .setDepth(0)
}

/**
 * Add a full-screen semi-transparent black rectangle (modal overlay).
 *
 * @param depth  Render depth (default 0)
 * @param alpha  Transparency (default 0.6)
 */
export function addModalOverlay(
  scene: Phaser.Scene,
  depth = 0,
  alpha = 0.6,
): Phaser.GameObjects.Rectangle {
  const cx = WORLD.width / 2
  const cy = WORLD.height / 2
  return scene.add
    .rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, alpha)
    .setDepth(depth)
}

/**
 * Add a coin counter (number + coin icon) pinned to the screen.
 * Returns the Text so the caller can update it when coins change.
 * Layout: [number][coin_icon] — number on the left, icon on the right.
 *
 * @param rightEdge  Right edge of the coin icon in screen pixels (default: near right border)
 * @param y          Vertical center in screen pixels (default: 20)
 */
export function addCoinCounter(
  scene: Phaser.Scene,
  rightEdge = WORLD.width - 8,
  y = 26,
): Phaser.GameObjects.Text {
  const iconSize = 22
  const iconCenterX = rightEdge - iconSize / 2

  scene.add
    .image(iconCenterX, y, 'shop-coin')
    .setDisplaySize(iconSize, iconSize)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(30)

  return scene.add
    .text(iconCenterX - iconSize / 2 - 4, y, String(CoinManager.getTotal()), {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: FONT_FAMILY,
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(1, 0.5)
    .setScrollFactor(0)
    .setDepth(30)
}

/**
 * Wire a button image and its label text to share hover/out/down behavior.
 * Both objects light up together on pointerover and dim together on pointerout.
 *
 * @param normalAlpha  Alpha when idle (default 0.85)
 * @param hoverAlpha   Alpha on hover  (default 1)
 * @param onDown       Callback fired on pointerdown on either object
 */
export function wireButtonLabel(
  btn: Phaser.GameObjects.Image,
  label: Phaser.GameObjects.Text,
  onDown: () => void,
  normalAlpha = 0.85,
  hoverAlpha = 1,
): void {
  const over = () => { btn.setAlpha(hoverAlpha);   label.setAlpha(hoverAlpha)   }
  const out  = () => { btn.setAlpha(normalAlpha);  label.setAlpha(normalAlpha)  }

  btn.on('pointerover', over)
  btn.on('pointerout',  out)
  btn.on('pointerdown', onDown)

  label.on('pointerover', over)
  label.on('pointerout',  out)
  label.on('pointerdown', onDown)
}

/**
 * Create a container-based secondary button (btn-secondary texture + label text).
 * Hover scales up by BTN_HOVER_DELTA and restores on out. onClick fires on pointerdown.
 * Returns the Container so callers can position, add to arrays, set depth, etc.
 */
export function createSecondaryButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick?: () => void,
  baseScale = 1,
): Phaser.GameObjects.Container {
  const bg = scene.add.image(0, 0, 'btn-secondary').setScale(2)
  const txt = scene.add.text(0, 0, label, {
    fontFamily: FONT_FAMILY,
    fontSize: '20px',
    color: '#000000',
  }).setOrigin(0.5)
  const container = scene.add.container(x, y, [bg, txt])
    .setSize(bg.width * 2, bg.height * 2)
    .setScale(baseScale)
    .setDepth(3)
    .setInteractive({ useHandCursor: true })

  container.on('pointerover', () => container.setScale(baseScale + BTN_HOVER_DELTA))
  container.on('pointerout',  () => container.setScale(baseScale))
  if (onClick) container.on('pointerdown', onClick)

  return container
}

/**
 * Bind a callback to the window Escape keydown event for the lifetime of the scene.
 * Automatically removes the listener when the scene shuts down.
 */
export function bindEscapeKey(scene: Phaser.Scene, callback: () => void): void {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') callback() }
  window.addEventListener('keydown', handler)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', handler))
}

/**
 * Muffle background music when this scene is active; restore on shutdown.
 */
export function applySceneMuffle(scene: Phaser.Scene): void {
  const musicScene = scene.scene.get('music-scene') as MusicScene | null
  if (!musicScene) return
  musicScene.setMuffled(true)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => musicScene.setMuffled(false))
}

/**
 * Show a floating "+N [icon]" popup that rises and fades out.
 * Both the text and icon are screen-space (scrollFactor 0).
 */
export function showFloatingPopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  iconKey: string,
  label: string,
  options: {
    fontSize?: string
    iconSize?: number
    yOffset?: number
    duration?: number
    depth?: number
  } = {},
): void {
  const { fontSize = '20px', iconSize = 18, yOffset = 40, duration = 900, depth = 40 } = options

  const text = scene.add
    .text(x - 1, y, label, {
      fontSize,
      color: '#ffd700',
      fontFamily: FONT_FAMILY,
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setScrollFactor(0)
    .setDepth(depth)
    .setOrigin(1, 0.5)

  const icon = scene.add
    .image(x + 1, y, iconKey)
    .setDisplaySize(iconSize, iconSize)
    .setScrollFactor(0)
    .setDepth(depth)
    .setOrigin(0, 0.5)

  scene.tweens.add({
    targets: [text, icon],
    y: y - yOffset,
    alpha: 0,
    duration,
    ease: 'Quad.easeOut',
    onComplete: () => { text.destroy(); icon.destroy() },
  })
}
