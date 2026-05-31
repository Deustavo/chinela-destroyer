import Phaser from 'phaser'

const KEY_MUSIC_LEVEL = 'audio_music_level'
const KEY_SFX_LEVEL   = 'audio_sfx_level'
const KEY_MUSIC_MUTED = 'audio_music_muted'
const KEY_SFX_MUTED   = 'audio_sfx_muted'

export const AudioManager = {
  getMusicLevel(): number {
    return Math.max(1, Math.min(10, parseInt(localStorage.getItem(KEY_MUSIC_LEVEL) ?? '7', 10)))
  },
  setMusicLevel(v: number): void {
    localStorage.setItem(KEY_MUSIC_LEVEL, String(Math.max(1, Math.min(10, v))))
  },
  getSfxLevel(): number {
    return Math.max(1, Math.min(10, parseInt(localStorage.getItem(KEY_SFX_LEVEL) ?? '7', 10)))
  },
  setSfxLevel(v: number): void {
    localStorage.setItem(KEY_SFX_LEVEL, String(Math.max(1, Math.min(10, v))))
  },
  isMusicMuted(): boolean {
    return localStorage.getItem(KEY_MUSIC_MUTED) === '1'
  },
  setMusicMuted(v: boolean): void {
    localStorage.setItem(KEY_MUSIC_MUTED, v ? '1' : '0')
  },
  isSfxMuted(): boolean {
    return localStorage.getItem(KEY_SFX_MUTED) === '1'
  },
  setSfxMuted(v: boolean): void {
    localStorage.setItem(KEY_SFX_MUTED, v ? '1' : '0')
  },
  getMusicVolume(): number {
    if (this.isMusicMuted()) return 0
    return this.getMusicLevel() / 10
  },
  getSfxVolume(): number {
    if (this.isSfxMuted()) return 0
    return this.getSfxLevel() / 10
  },
}

/** Play a one-shot SFX respecting the current SFX volume setting.
 *  @param relVol  Relative volume for this clip (same as hardcoded values, e.g. 0.7). */
export function playSfx(scene: Phaser.Scene, key: string, relVol = 1): void {
  const vol = AudioManager.getSfxVolume() * relVol
  if (vol <= 0) return
  scene.sound.play(key, { volume: vol })
}
