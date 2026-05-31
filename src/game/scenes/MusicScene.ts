import Phaser from 'phaser'
import { AudioManager } from '../utils/AudioManager'

const VOLUME_MUFFLED = 0.12

export class MusicScene extends Phaser.Scene {
  private music!: Phaser.Sound.BaseSound & { volume: number }

  constructor() {
    super({ key: 'music-scene', active: false })
  }

  create() {
    this.music = this.sound.add('theme', { loop: true, volume: AudioManager.getMusicVolume() }) as Phaser.Sound.BaseSound & { volume: number }
    this.music.play()
  }

  applyMusicVolume() {
    if (!this.music) return
    this.tweens.killTweensOf(this.music)
    this.music.volume = AudioManager.getMusicVolume()
  }

  setMuffled(muffled: boolean) {
    if (!this.music) return
    this.tweens.killTweensOf(this.music)
    this.tweens.add({
      targets: this.music,
      volume: muffled ? Math.min(VOLUME_MUFFLED, AudioManager.getMusicVolume()) : AudioManager.getMusicVolume(),
      duration: 400,
      ease: 'Sine.InOut',
    })
  }
}
