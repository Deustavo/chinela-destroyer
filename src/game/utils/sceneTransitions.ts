import Phaser from 'phaser'
import { WORLD } from '../config/constants'

/**
 * Minimal structural type accepted by dropIn, dropInFloat, and exitTo.
 * Covers Image, Text, Sprite, and sized Containers.
 */
export type SceneObject = { y: number; displayHeight?: number }

/**
 * Animate an object dropping in from off-screen top to its current y position.
 *
 * @param clearance Extra pixels above the object's height to start from.
 *   Use 20 (default) for flat objects, 40 for Containers.
 */
export function dropIn(
  scene: Phaser.Scene,
  obj: SceneObject,
  delay: number,
  clearance = 20,
): void {
  const finalY = obj.y
  const h = obj.displayHeight ?? 0
  obj.y = -Math.abs(h) - clearance

  scene.tweens.add({
    targets: obj,
    y: finalY,
    duration: 900,
    delay,
    ease: 'Cubic.easeOut',
  })
}

/**
 * Drop-in followed by an infinite floating tween.
 * The object floats upward by `amplitude` pixels and back (yoyo, repeat -1).
 * amplitude: 0 is valid — only the drop happens (no float tween added).
 */
export function dropInFloat(
  scene: Phaser.Scene,
  obj: SceneObject,
  opts: { delay: number; amplitude: number; floatDuration: number },
): void {
  const finalY = obj.y
  const h = obj.displayHeight ?? 0
  obj.y = -Math.abs(h) - 20

  scene.tweens.add({
    targets: obj,
    y: finalY,
    duration: 900,
    delay: opts.delay,
    ease: 'Cubic.easeOut',
    onComplete:
      opts.amplitude > 0
        ? () => {
            scene.tweens.add({
              targets: obj,
              y: finalY - opts.amplitude,
              duration: opts.floatDuration,
              ease: 'Sine.easeInOut',
              yoyo: true,
              repeat: -1,
            })
          }
        : undefined,
  })
}

/**
 * Fly all elements off the top of the screen, then start targetScene.
 * Each element is staggered 40ms apart.
 */
export function exitTo(
  scene: Phaser.Scene,
  targetScene: string,
  elements: SceneObject[],
  data?: object,
): void {
  if (elements.length === 0) { scene.scene.start(targetScene, data); return }

  // Disable all interactive elements immediately to prevent double-click
  elements.forEach(el => {
    if ('disableInteractive' in el && typeof (el as any).disableInteractive === 'function') {
      ;(el as any).disableInteractive()
    }
  })

  elements.forEach((el, i) => {
    scene.tweens.killTweensOf(el)
    scene.tweens.add({
      targets: el,
      y: -WORLD.height,
      duration: 600,
      delay: i * 40,
      ease: 'Cubic.easeIn',
      onComplete:
        i === elements.length - 1
          ? () => scene.scene.start(targetScene, data)
          : undefined,
    })
  })
}
