class GameTest {
  #levelsPath = './src/assets/levels/gameConfig/levels.json'
  #backgroundsPath = './src/assets/levels/backgrounds'
  #wrapper = null
  #backgroundItems = []
  #currentPreviewIndex = -1
  #preview = null
  
  constructor() {
    this.init()
  }
  
  init = async () => {
    const levels = await this.#loadLevels()
    this.#createWrapper()
    this.#renderBackgrounds(levels)
    this.#setEvents()
  }
  
  #setEvents = () => {
    this.#wrapper.addEventListener('click', this.#onBackgroundClick)
    document.addEventListener('click', this.#onPreviewClick)
    document.addEventListener('keydown', this.#onDocumentKeydown)
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
    this.#backgroundItems = []
    
    Object.keys(levels).forEach(levelKey => {
      const levelIndex = levelKey.replace('level', '')
      const levelData = levels[levelKey]
      
      const background = this.#createBackgroundItem(levelIndex, levelData.spineName)
      
      this.#backgroundItems.push(background)
      this.#wrapper.appendChild(background)
    })
  }
  
  #createBackgroundItem = (levelIndex, spineName) => {
    const background = document.createElement('div')
    background.className = 'background'
    background.dataset.src = `${this.#backgroundsPath}/back_lv${levelIndex}.webp`
    background.dataset.title = `${levelIndex} - ${spineName}`
    
    const label = document.createElement('div')
    label.className = 'background__label'
    label.textContent = background.dataset.title
    
    const img = document.createElement('img')
    img.src = background.dataset.src
    img.alt = `back_lv${levelIndex}`
    
    background.append(label, img)
    
    return background
  }
  
  #onBackgroundClick = event => {
    const background = event.target.closest('.background')
    
    if (!background || !this.#wrapper.contains(background)) {
      return
    }
    
    const index = this.#backgroundItems.indexOf(background)
    
    if (index === -1) {
      return
    }
    
    this.#currentPreviewIndex = index
    this.#openPreview()
  }
  
  #onPreviewClick = event => {
    if (!this.#preview) {
      return
    }
    
    if (event.target !== this.#preview) {
      return
    }
    
    this.#closePreview()
  }
  
  #onDocumentKeydown = event => {
    if (!this.#preview) return
    
    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault()
    }
    
    if (event.key === 'Escape') {
      this.#closePreview()
      return
    }
    
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      this.#showNextPreview()
      return
    }
    
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      this.#showPrevPreview()
    }
  }
  
  #openPreview = () => {
    const currentBackground = this.#backgroundItems[this.#currentPreviewIndex]
    
    if (!currentBackground) {
      return
    }
    
    const currentSrc = currentBackground.dataset.src
    const currentTitle = currentBackground.dataset.title
    
    if (!this.#preview) {
      this.#preview = document.createElement('div')
      this.#preview.className = 'preview'
      
      const title = document.createElement('div')
      title.className = 'preview__title'
      
      const img = document.createElement('img')
      img.className = 'preview__image'
      img.alt = 'preview'
      
      this.#preview.append(title, img)
      this.#preview.addEventListener('wheel', this.#onPreviewWheel, { passive: false })
      
      document.body.appendChild(this.#preview)
    }
    
    const title = this.#preview.querySelector('.preview__title')
    const img = this.#preview.querySelector('.preview__image')
    
    title.textContent = currentTitle
    img.src = currentSrc
  }
  
  #closePreview = () => {
    if (!this.#preview) {
      return
    }
    
    this.#preview.removeEventListener('wheel', this.#onPreviewWheel)
    this.#preview.remove()
    this.#preview = null
    this.#currentPreviewIndex = -1
  }
  
  #onPreviewWheel = event => {
    event.preventDefault()
    
    if (event.deltaY > 0) {
      this.#showNextPreview()
      return
    }
    
    if (event.deltaY < 0) {
      this.#showPrevPreview()
    }
  }
  
  #showNextPreview = () => {
    if (!this.#backgroundItems.length) {
      return
    }
    
    this.#currentPreviewIndex += 1
    
    if (this.#currentPreviewIndex >= this.#backgroundItems.length) {
      this.#currentPreviewIndex = 0
    }
    
    this.#openPreview()
  }
  
  #showPrevPreview = () => {
    if (!this.#backgroundItems.length) {
      return
    }
    
    this.#currentPreviewIndex -= 1
    
    if (this.#currentPreviewIndex < 0) {
      this.#currentPreviewIndex = this.#backgroundItems.length - 1
    }
    
    this.#openPreview()
  }
}

new GameTest()
