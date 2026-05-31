import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { MenuScene } from './scenes/MenuScene'
import { MainScene } from './scenes/MainScene'
import { GameOverScene } from './scenes/GameOverScene'
import { PauseScene } from './scenes/PauseScene'
import { CreditsScene } from './scenes/CreditsScene'
import { AchievementsScene } from './scenes/AchievementsScene'
import { ShopScene } from './scenes/ShopScene'
import { MusicScene } from './scenes/MusicScene'
import { WORLD } from './config/constants'

export class Game extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      width: WORLD.width,
      height: WORLD.height,
      backgroundColor: WORLD.backgroundColor,
      smoothPixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        activePointers: 3,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: WORLD.gravity },
          debug: false,
          fixedStep: false,
        },
      },
      scene: [PreloadScene, MenuScene, MainScene, GameOverScene, PauseScene, CreditsScene, AchievementsScene, ShopScene, MusicScene],
    })
  }
}
