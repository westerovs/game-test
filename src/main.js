class GameTest {
  #levelsPath = './src/assets/levels/gameConfig/levels.json'
  #backgroundsPath = './src/assets/levels/backgrounds'
  #wrapper = null
  
  constructor() {
    this.init()
  }
  
  init = async () => {
    const levels = await this.#loadLevels()
    this.#createWrapper()
    this.#renderBackgrounds(levels)
  }
  
  #loadLevels = async () => {
    const res = await fetch(this.#levelsPath)
    return res.json()
  }
  
  #createWrapper = () => {
    this.#wrapper = document.createElement('div')
    this.#wrapper.className = 'wrapper'
    document.body.appendChild(this.#wrapper)
  }
  
  #renderBackgrounds = levels => {
    Object.keys(levels).forEach(levelKey => {
      const levelIndex = levelKey.replace('level', '')
      const levelData = levels[levelKey]
      
      const background = this.#createBackgroundItem(levelIndex, levelData.spineName)
      this.#wrapper.appendChild(background)
    })
  }
  
  #createBackgroundItem = (levelIndex, spineName) => {
    const background = document.createElement('div')
    background.className = 'background'
    
    const label = document.createElement('div')
    label.className = 'background__label'
    label.textContent = `${levelIndex} - ${spineName}`
    
    const img = document.createElement('img')
    img.src = `${this.#backgroundsPath}/back_lv${levelIndex}.webp`
    img.alt = `back_lv${levelIndex}`
    
    background.append(label, img)
    
    return background
  }
}

new GameTest()
