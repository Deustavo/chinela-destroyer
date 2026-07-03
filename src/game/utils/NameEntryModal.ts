import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addModalOverlay, createSecondaryButton } from './uiHelpers'
import { playSfx } from './AudioManager'
import { t } from '../lang'

const MAX_NAME_LEN = 16

/**
 * Show a modal asking the player to type a name for the leaderboard.
 * Uses a real DOM <input> overlaid on the canvas so the native (mobile) keyboard
 * shows up. Resolves with the trimmed name, or null if the player skips / leaves.
 */
export function promptForName(scene: Phaser.Scene, defaultName: string): Promise<string | null> {
  return new Promise((resolve) => {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2
    const DEPTH = 200

    // setScrollFactor(0) pins the modal to the screen. Harmless in GameOverScene
    // (camera never scrolls) but required in MainScene, where the camera is scrolled
    // thousands of pixels up when the classic-mode victory prompt appears.
    const overlay = addModalOverlay(scene, DEPTH, 0.75).setScrollFactor(0).setInteractive()
    const panel = scene.add.image(cx, cy, 'modal-bg')
      .setDisplaySize(320, 280)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)

    const title = scene.add.text(cx, cy - 96, t('new_record_title'), {
      fontSize: '24px', color: '#ffd700', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2)

    const prompt = scene.add.text(cx, cy - 58, t('enter_name'), {
      fontSize: '15px', color: '#ffffff', fontFamily: FONT_FAMILY, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2)

    // ── DOM input ────────────────────────────────────────────────────────────
    const canvas = scene.game.canvas
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = MAX_NAME_LEN
    input.value = defaultName
    input.setAttribute('autocomplete', 'off')
    input.setAttribute('autocorrect', 'off')
    input.setAttribute('spellcheck', 'false')
    Object.assign(input.style, {
      position: 'fixed',
      textAlign: 'center',
      border: '2px solid #ffd700',
      borderRadius: '6px',
      background: '#111111',
      color: '#ffffff',
      fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
      outline: 'none',
      boxSizing: 'border-box',
      zIndex: '9999',
      opacity: '0',
      transition: 'opacity 180ms ease',
    } as CSSStyleDeclaration)
    document.body.appendChild(input)

    const reposition = () => {
      const rect = canvas.getBoundingClientRect()
      const sx = rect.width / WORLD.width
      const sy = rect.height / WORLD.height
      const w = 220 * sx
      const h = 36 * sy
      input.style.width = `${w}px`
      input.style.height = `${h}px`
      input.style.left = `${rect.left + cx * sx - w / 2}px`
      input.style.top = `${rect.top + (cy - 18) * sy}px`
      input.style.fontSize = `${16 * sy}px`
    }
    reposition()
    window.addEventListener('resize', reposition)
    // Focus after the current frame so mobile browsers reliably raise the keyboard.
    scene.time.delayedCall(50, () => { input.focus(); input.select() })

    const submitBtn = createSecondaryButton(scene, cx, cy + 60, t('submit'))
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)

    const skipTxt = scene.add.text(cx, cy + 108, t('skip'), {
      fontSize: '14px', color: '#aaaaaa', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true })

    // ── Entrance animation (same feel as the achievements modal) ───────────────
    // Panel + overlay use setDisplaySize, so animate alpha only (scale would
    // override the display size). Text/button get a scale + alpha pop.
    const content = [title, prompt, submitBtn, skipTxt]
    overlay.setAlpha(0)
    panel.setAlpha(0)
    content.forEach(o => { o.setAlpha(0); o.setScale(0.85) })
    scene.tweens.add({ targets: overlay, alpha: 0.75, duration: 180, ease: 'Cubic.easeOut' })
    scene.tweens.add({ targets: panel, alpha: 1, duration: 180, ease: 'Cubic.easeOut' })
    scene.tweens.add({ targets: content, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' })
    scene.time.delayedCall(20, () => { input.style.opacity = '1' })

    let dismissing = false
    let finalized = false

    // Immediate teardown — also the path taken if the scene shuts down mid-animation.
    const finalize = (result: string | null) => {
      if (finalized) return
      finalized = true
      window.removeEventListener('resize', reposition)
      input.remove()
      ;[overlay, panel, title, prompt, submitBtn, skipTxt].forEach(o => o.destroy())
      resolve(result)
    }

    // Exit animation, then teardown + resolve.
    const dismiss = (result: string | null) => {
      if (dismissing) return
      dismissing = true
      input.style.opacity = '0'
      scene.tweens.add({ targets: [overlay, panel], alpha: 0, duration: 140, ease: 'Cubic.easeIn' })
      scene.tweens.add({
        targets: content, alpha: 0, scale: 0.85, duration: 140, ease: 'Cubic.easeIn',
        onComplete: () => finalize(result),
      })
    }

    const submit = () => {
      const name = input.value.trim().slice(0, MAX_NAME_LEN)
      dismiss(name.length > 0 ? name : null)
    }

    input.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') submit()
    })
    submitBtn.on('pointerdown', () => { playSfx(scene, 'button-click'); submit() })
    skipTxt.on('pointerdown', () => { playSfx(scene, 'button-click'); dismiss(null) })

    // If the scene is torn down while the modal is open, drop the DOM input too.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => finalize(null))
  })
}
