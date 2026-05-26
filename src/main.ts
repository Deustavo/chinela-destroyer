import './style.css'
import { Game } from './game/Game'
import { inject } from "@vercel/analytics"

inject()
document.fonts.load('bold 16px "Comic Neue"').then(() => {
  new Game()
})
