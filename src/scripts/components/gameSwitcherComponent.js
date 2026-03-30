import Utils from '../utils/Utils.js'

export const createGameSwitcher = ({
                                   gameConfig,
                                   currentGameKey,
                                   onChange = () => Utils.abstractMethod('onChange')
                                 }) => {
  const select = document.createElement('select')
  select.className = 'game-select'
  
  Object.keys(gameConfig).forEach(gameKey => {
    const option = document.createElement('option')
    option.value = gameKey
    option.textContent = gameKey
    option.selected = gameKey === currentGameKey
    select.appendChild(option)
  })
  
  select.addEventListener('change', event => {
    onChange(event.target.value)
  })
  
  return select
}
