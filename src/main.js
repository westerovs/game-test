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
    this.#setEvents()
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
    background.dataset.src = `${this.#backgroundsPath}/back_lv${levelIndex}.webp`
    
    const label = document.createElement('div')
    label.className = 'background__label'
    label.textContent = `${levelIndex} - ${spineName}`
    
    const img = document.createElement('img')
    img.src = background.dataset.src
    img.alt = `back_lv${levelIndex}`
    
    background.append(label, img)
    
    return background
  }
  
  #setEvents = () => {
    this.#wrapper.addEventListener('click', this.#onBackgroundClick)
    document.addEventListener('click', this.#onPreviewClick)
    document.addEventListener('keydown', this.#onDocumentKeydown)
  }
  
  #onBackgroundClick = event => {
    const background = event.target.closest('.background')
    
    if (!background || !this.#wrapper.contains(background)) {
      return
    }
    
    const label = background.querySelector('.background__label')
    
    this.#openPreview(background.dataset.src, label.textContent)
  }
  
  #onPreviewClick = event => {
    const preview = event.target.closest('.preview')
    
    if (!preview) {
      return
    }
    
    this.#closePreview()
  }
  
  #onDocumentKeydown = event => {
    if (event.key !== 'Escape') {
      return
    }
    
    this.#closePreview()
  }
  
  #openPreview = (src, text) => {
    if (document.querySelector('.preview')) {
      return
    }
    
    const preview = document.createElement('div')
    preview.className = 'preview'
    
    const title = document.createElement('div')
    title.className = 'preview__title'
    title.textContent = text
    
    const img = document.createElement('img')
    img.className = 'preview__image'
    img.src = src
    img.alt = 'preview'
    
    preview.append(title, img)
    document.body.appendChild(preview)
  }
  
  #closePreview = () => {
    const preview = document.querySelector('.preview')
    
    if (!preview) {
      return
    }
    
    preview.remove()
  }
}

new GameTest()
