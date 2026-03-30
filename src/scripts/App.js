import {createGameSwitcher} from './components/gameSwitcherComponent.js'
import {DEFAULT_GAME_KEY, GAME_CONFIG} from './config.js'
import GameTest from './GameTest.js'

export default class App {
  #gameTest = null
  #currentGameKey = DEFAULT_GAME_KEY
  #gameSelect = null
  
  constructor() {
    this.#renderGameSelect()
    this.#mountGame(this.#currentGameKey)
  }
  
  #renderGameSelect = () => {
    const buttonsRow = document.querySelector('.buttons-row')
    
    if (!buttonsRow) {
      return
    }
    
    this.#gameSelect = createGameSwitcher({
      gameConfig: GAME_CONFIG,
      currentGameKey: this.#currentGameKey,
      onChange: this.#onGameChange
    })
    
    buttonsRow.prepend(this.#gameSelect)
  }
  
  #onGameChange = nextGameKey => {
    if (!GAME_CONFIG[nextGameKey] || nextGameKey === this.#currentGameKey) {
      return
    }
    
    this.#currentGameKey = nextGameKey
    this.#mountGame(nextGameKey)
  }
  
  #mountGame = gameKey => {
    this.#gameTest?.destroy()
    this.#gameTest = new GameTest({gameKey})
  }
}

