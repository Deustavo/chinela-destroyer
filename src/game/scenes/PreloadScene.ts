import Phaser from 'phaser'
import { PLAYER, ENEMY, PLATFORMS, BOSS_SHIP, SHOT, WORLD, SHIELD } from '../config/constants'
import { ITEM_REGISTRY } from '../items/registry'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload-scene')
  }

  preload() {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.textures.remove(file.key)
    })

    const { spritesheet } = PLAYER

    this.load.spritesheet(PLAYER.spriteKey, spritesheet.path, {
      frameWidth: spritesheet.frameWidth,
      frameHeight: spritesheet.frameHeight,
    })

    this.load.spritesheet(ENEMY.spriteKey, ENEMY.spritesheet.path, {
      frameWidth: ENEMY.spritesheet.frameWidth,
      frameHeight: ENEMY.spritesheet.frameHeight,
    })

    this.load.spritesheet(ENEMY.trapsKey, ENEMY.trapsSheet.path, {
      frameWidth: ENEMY.trapsSheet.frameWidth,
      frameHeight: ENEMY.trapsSheet.frameHeight,
    })

    this.load.image('bg', '/assets/homeScreen/background.png')

    this.load.image('menu-logo', '/assets/homeScreen/logo.png')
    this.load.image('menu-chinela', '/assets/homeScreen/chinela.png')
    this.load.image('menu-pera', '/assets/homeScreen/pera.png')
    this.load.image('menu-play-btn', '/assets/homeScreen/play.png')
    this.load.image('menu-credits-btn', '/assets/homeScreen/credits.png')

    this.load.image('gameover-fim', '/assets/gameOverScreen/fim.png')
    this.load.image('gameover-de', '/assets/gameOverScreen/de.png')
    this.load.image('gameover-jogo', '/assets/gameOverScreen/jogo.png')
    this.load.image('gameover-chinela', '/assets/gameOverScreen/chinela.png')

    this.load.image('btn-left', '/assets/buttons/left.png')
    this.load.image('btn-right', '/assets/buttons/right.png')
    this.load.image('btn-up', '/assets/buttons/up.png')
    this.load.image('btn-pause', '/assets/buttons/pause.png')
    this.load.image('btn-play', '/assets/buttons/play.png')
    this.load.image('btn-home', '/assets/buttons/home.png')
    this.load.image(SHOT.btnKey, SHOT.btnPath)
    this.load.spritesheet(SHOT.spriteKey, SHOT.spritesheet.path, {
      frameWidth: SHOT.spritesheet.frameWidth,
      frameHeight: SHOT.spritesheet.frameHeight,
    })

    this.load.image('credits-gatas', '/assets/creditsScreen/gatasbobas.png')
    this.load.image('credits-github', '/assets/creditsScreen/github.png')

    this.load.image('menu-shop-btn', '/assets/homeScreen/shop.png')
    this.load.image('shop-coin', '/assets/shop/coin.png')

    this.load.image('btn-trophy', '/assets/achievements/trophy.png')
    this.load.image('achievement-locked', '/assets/achievements/medal-blocked.png')
    this.load.image('achievement-1', '/assets/achievements/medal-100.png')
    this.load.image('achievement-2', '/assets/achievements/medal-200.png')
    this.load.image('achievement-3', '/assets/achievements/medal-500.png')
    this.load.image('achievement-4', '/assets/achievements/meda-1000.png')
    this.load.image('achievement-5', '/assets/achievements/medal-2000.png')
    this.load.image('achievement-6', '/assets/achievements/medal-3000.png')

    this.load.spritesheet(BOSS_SHIP.spriteKey, BOSS_SHIP.spritesheet.path, {
      frameWidth: BOSS_SHIP.spritesheet.frameWidth,
      frameHeight: BOSS_SHIP.spritesheet.frameHeight,
    })

    this.load.image(PLATFORMS.textureKey, PLATFORMS.texturePath)
    this.load.image(PLATFORMS.movingTextureKey, PLATFORMS.movingTexturePath)
    this.load.image(WORLD.floorTextureKey, WORLD.floorTexturePath)

    this.load.image('modal-bg', '/assets/modal/modalBG.png')
    this.load.image('modal-bg2', '/assets/modal/modalBG2.png')
    this.load.image('modal-bg3', '/assets/modal/modalBG3.png')

    this.load.spritesheet(SHIELD.spriteKey, SHIELD.spritesheet.path, {
      frameWidth: SHIELD.spritesheet.frameWidth,
      frameHeight: SHIELD.spritesheet.frameHeight,
    })

    // Load assets for all registered shop items
    for (const item of ITEM_REGISTRY) {
      if (item.type === 'shot' && item.shotConfig) {
        const { spriteKey, spritesheet } = item.shotConfig
        this.load.spritesheet(spriteKey, spritesheet.path, {
          frameWidth: spritesheet.frameWidth,
          frameHeight: spritesheet.frameHeight,
        })
      } else if (item.iconPath) {
        this.load.image(item.iconKey, item.iconPath)
      }
    }
  }

  create() {
    const g = this.make.graphics()
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 1, 1)
    g.generateTexture('pixel', 1, 1)
    g.setVisible(false)
    g.destroy()

    this.scene.start('menu-scene')
  }
}
