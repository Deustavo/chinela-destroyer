import Phaser from 'phaser'

export class MusicScene extends Phaser.Scene {
  constructor() {
    super({ key: 'music-scene', active: false })
  }

  create() {
    const music = this.sound.add('theme', { loop: true, volume: 0.5 })
    music.play()
  }
}
