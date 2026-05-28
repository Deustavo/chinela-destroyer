import Phaser from 'phaser'
import { WORLD, FONT_FAMILY } from '../config/constants'
import { addBackground, wireButtonLabel, addCoinCounter } from '../utils/uiHelpers'
import { dropIn, dropInFloat, exitTo, type SceneObject } from '../utils/sceneTransitions'

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('credits-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    addBackground(this)
    addCoinCounter(this)

    const title = this.add
      .text(cx, cy - 240, 'Créditos', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
      })
      .setOrigin(0.5)

    const devText = this.add
      .text(cx, cy - 140, 'Feito por Deustavo. Siga meu github para mais projetos <3', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5)

    const btnGithub = this.add
      .image(cx - 76, cy - 80, 'credits-github')
      .setDisplaySize(48, 48)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const repoText = this.add
      .text(cx - 76 + 20, cy - 78, '/Deustavo/chinela-destroyer', {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: FONT_FAMILY,
      })
      .setOrigin(0, 0.5)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const gatas = this.add
      .image(cx, cy + 70, 'credits-gatas')
      .setDisplaySize(240, 160)

    const nameChinela = this.add
      .text(cx - 42, cy - 10, 'Chinela', {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffdd88',
        fontFamily: FONT_FAMILY,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    const arrowChinela = this.add
      .text(cx - 42, cy + 18, '↓', {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffdd88',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    const namePera = this.add
      .text(cx + 40, cy - 10, 'Pera', {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#88ddff',
        fontFamily: FONT_FAMILY,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    const arrowPera = this.add
      .text(cx + 40, cy + 18, '↓', {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#88ddff',
        fontFamily: FONT_FAMILY,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)


    const caption = this.add
      .text(cx, cy + 180, 'as protagonistas são essas gatas endeotas', {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5)

    const btnBack = this.add
      .image(cx, cy + 265, 'btn-home')
      .setDisplaySize(64, 64)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const labelBack = this.add
      .text(cx, cy + 245 + 32 + 10, 'Início', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: FONT_FAMILY,
      })
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const elements: SceneObject[] = [title, devText, btnGithub, repoText, gatas, nameChinela, arrowChinela, namePera, arrowPera, caption, btnBack, labelBack]

    const openRepo = () => window.open('https://github.com/Deustavo/chinela-destroyer', '_blank')

    btnGithub.on('pointerover', () => { btnGithub.setAlpha(1); repoText.setAlpha(1).setColor('#ffffff') })
    btnGithub.on('pointerout', () => { btnGithub.setAlpha(0.85); repoText.setAlpha(0.85).setColor('#aaaaaa') })
    btnGithub.on('pointerdown', openRepo)

    repoText.on('pointerover', () => { repoText.setAlpha(1).setColor('#ffffff'); btnGithub.setAlpha(1) })
    repoText.on('pointerout', () => { repoText.setAlpha(0.85).setColor('#aaaaaa'); btnGithub.setAlpha(0.85) })
    repoText.on('pointerdown', openRepo)

    wireButtonLabel(btnBack, labelBack, () => exitTo(this, 'menu-scene', elements))

    dropIn(this, title,     0)
    dropIn(this, devText,   80)
    dropIn(this, btnGithub, 160)
    dropIn(this, repoText,  160)
    dropIn(this, gatas, 240)
    dropInFloat(this, nameChinela,  { delay: 240, amplitude: 6, floatDuration: 1200 })
    dropInFloat(this, arrowChinela, { delay: 240, amplitude: 6, floatDuration: 1200 })
    dropInFloat(this, namePera,     { delay: 240, amplitude: 6, floatDuration: 1400 })
    dropInFloat(this, arrowPera,    { delay: 240, amplitude: 6, floatDuration: 1400 })
    dropIn(this, caption,      320)
    dropIn(this, btnBack,   400)
    dropIn(this, labelBack, 450)
  }
}
