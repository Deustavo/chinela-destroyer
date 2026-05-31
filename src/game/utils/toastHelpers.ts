import Phaser from 'phaser'

export function showIconToast(scene: Phaser.Scene, iconKey: string, onComplete?: () => void): void {
  const iconSize = 28
  const padding = 4
  const panelW = iconSize + padding * 2
  const panelH = iconSize + padding
  const finalX = panelW / 2 + 8
  const startX = -(panelW + 10)
  const panelY = 28

  const container = scene.add.container(startX, panelY).setScrollFactor(0).setDepth(50)
  const panel = scene.add.rectangle(0, 0, panelW, panelH, 0x111111, 0.82).setStrokeStyle(1, 0xffd700)
  const icon = scene.add.image(0, 0, iconKey).setDisplaySize(iconSize, iconSize)
  container.add([panel, icon])

  scene.tweens.add({
    targets: container,
    x: finalX,
    duration: 300,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      scene.time.delayedCall(1800, () => {
        scene.tweens.add({
          targets: container,
          x: -(panelW + 10),
          duration: 250,
          ease: 'Cubic.easeIn',
          onComplete: () => { container.destroy(); onComplete?.() },
        })
      })
    },
  })
}
