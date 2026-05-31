import Phaser from 'phaser'

const VOLUME_NORMAL = 0.5
const VOLUME_MUFFLED = 0.2

export class MusicScene extends Phaser.Scene {
  private music!: Phaser.Sound.BaseSound & { volume: number }

  constructor() {
    super({ key: 'music-scene', active: false })
  }

  create() {
    this.music = this.sound.add('theme', { loop: true, volume: VOLUME_NORMAL }) as Phaser.Sound.BaseSound & { volume: number }
    this.music.play()
  }

  setMuffled(muffled: boolean) {
    if (!this.music) return
    this.tweens.killTweensOf(this.music)
    this.tweens.add({
      targets: this.music,
      volume: muffled ? VOLUME_MUFFLED : VOLUME_NORMAL,
      duration: 400,
      ease: 'Sine.InOut',
    })
  }
}
