import Phaser from 'phaser'
import { WORLD } from '../config/constants'

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('credits-scene')
  }

  create() {
    const cx = WORLD.width / 2
    const cy = WORLD.height / 2

    const title = this.add
      .text(cx, cy - 240, 'Créditos', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
      })
      .setOrigin(0.5)

    const devText = this.add
      .text(cx, cy - 140, 'Feito por Deustavo. Siga meu github para mais projetos como esse <3', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
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
        fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const gatas = this.add
      .image(cx, cy + 70, 'credits-gatas')
      .setDisplaySize(240, 160)

    const caption = this.add
      .text(cx, cy + 180, 'as protagonistas são essas gatas endeotas', {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5)

    const btnBack = this.add
      .image(cx, cy + 265, 'btn-home')
      .setDisplaySize(64, 64)
      .setInteractive({ cursor: 'pointer' })
      .setAlpha(0.85)

    const openRepo = () => window.open('https://github.com/Deustavo/chinela-destroyer', '_blank')

    btnGithub.on('pointerover', () => { btnGithub.setAlpha(1); repoText.setAlpha(1).setColor('#ffffff') })
    btnGithub.on('pointerout', () => { btnGithub.setAlpha(0.85); repoText.setAlpha(0.85).setColor('#aaaaaa') })
    btnGithub.on('pointerdown', openRepo)

    repoText.on('pointerover', () => { repoText.setAlpha(1).setColor('#ffffff'); btnGithub.setAlpha(1) })
    repoText.on('pointerout', () => { repoText.setAlpha(0.85).setColor('#aaaaaa'); btnGithub.setAlpha(0.85) })
    repoText.on('pointerdown', openRepo)

    btnBack.on('pointerover', () => btnBack.setAlpha(1))
    btnBack.on('pointerout', () => btnBack.setAlpha(0.85))
    btnBack.on('pointerdown', () => this.exitTo('menu-scene', [title, devText, btnGithub, repoText, gatas, caption, btnBack]))

    this.dropIn(title,     0)
    this.dropIn(devText,   80)
    this.dropIn(btnGithub, 160)
    this.dropIn(repoText,  160)
    this.dropIn(gatas,     240)
    this.dropIn(caption,   320)
    this.dropIn(btnBack,   400)
  }

  private dropIn(obj: Phaser.GameObjects.Image | Phaser.GameObjects.Text, delay: number) {
    const finalY = obj.y
    obj.y = -Math.abs(obj.displayHeight) - 20

    this.tweens.add({
      targets: obj,
      y: finalY,
      duration: 900,
      delay,
      ease: 'Cubic.easeOut',
    })
  }

  private exitTo(scene: string, elements: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[]) {
    elements.forEach((el, i) => {
      this.tweens.killTweensOf(el)
      this.tweens.add({
        targets: el,
        y: -WORLD.height,
        duration: 600,
        delay: i * 40,
        ease: 'Cubic.easeIn',
        onComplete: i === elements.length - 1 ? () => this.scene.start(scene) : undefined,
      })
    })
  }
}
