import './style.css'
import { Game } from './game/Game'

document.fonts.load('bold 16px "Comic Neue"').then(() => {
  new Game()
})
