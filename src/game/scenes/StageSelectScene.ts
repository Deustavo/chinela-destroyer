import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, addCoinCounter, bindEscapeKey } from '../utils/uiHelpers'
import { playSfx } from '../utils/AudioManager'
import { dropIn, exitTo, type SceneObject } from '../utils/sceneTransitions'
import { storageGet, parseJson } from '../utils/storage'

const STAGES = [
  { label: 'Estágio 1', sub: 'Começa na altura 0',    startStage: 0 },
  { label: 'Estágio 2', sub: 'Começa na altura 1000', startStage: 1 },
  { label: 'Estágio 3', sub: 'Começa na altura 2000', startStage: 2 },
]

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('stage-select-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    addBackground(this)
    addCoinCounter(this)

    const unlockedStages = parseJson<number[]>(storageGet('normalStagesUnlocked'), [0])

    const title = this.add.text(cx, cy - 260, 'Modo Normal', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5)

    const elements: SceneObject[] = [title]

    const CARD_W = 300
    const CARD_H = 72
    const CARD_GAP = 16
    const firstY = cy - 120

    STAGES.forEach((stage, i) => {
      const cardY = firstY + i * (CARD_H + CARD_GAP)
      const unlocked = unlockedStages.includes(stage.startStage)

      const bg = this.add.image(cx, cardY, unlocked ? 'modal-large-bg1' : 'modal-large-bg2')
        .setDisplaySize(CARD_W, CARD_H)

      const labelText = this.add.text(cx, cardY - 12, stage.label, {
        fontSize: '22px',
        color: unlocked ? '#ffffff' : '#888888',
        fontFamily: FONT_FAMILY,
      }).setOrigin(0.5)

      const subText = this.add.text(cx, cardY + 16, unlocked ? stage.sub : 'Bloqueado', {
        fontSize: '14px',
        color: unlocked ? '#aaaaaa' : '#666666',
        fontFamily: FONT_FAMILY,
      }).setOrigin(0.5)

      if (unlocked) {
        bg.setInteractive({ useHandCursor: true })
        bg.on('pointerover', () => bg.setAlpha(0.8))
        bg.on('pointerout', () => bg.setAlpha(1))

        bg.on('pointerdown', () => {
          playSfx(this, 'button-click')
          exitTo(this, 'main-scene', elements, { gameMode: 'normal', startStage: stage.startStage })
        })
      } else {
        bg.setInteractive({ useHandCursor: false })
        bg.on('pointerdown', () => playSfx(this, 'error', 3))
      }

      elements.push(bg as unknown as SceneObject, labelText, subText)
    })

    const btnBack = this.add
      .image(cx, cy + 270, 'btn-home')
      .setDisplaySize(64, 64)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelBack = this.add.text(cx, cy + 292 , 'Início', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setAlpha(0.85)

    elements.push(btnBack as unknown as SceneObject, labelBack)

    const goBack = () => { playSfx(this, 'button-click'); exitTo(this, 'menu-scene', elements) }
    btnBack.on('pointerover', () => btnBack.setAlpha(1))
    btnBack.on('pointerout', () => btnBack.setAlpha(0.85))
    btnBack.on('pointerdown', goBack)
    labelBack.setInteractive({ cursor: 'pointer' }).on('pointerdown', goBack)
    bindEscapeKey(this, goBack)

    elements.forEach((el, i) => dropIn(this, el, i * 60))
  }
}
