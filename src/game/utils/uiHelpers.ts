import Phaser from 'phaser'
import { WORLD } from '../config/constants'

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
