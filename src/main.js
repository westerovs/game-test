class GameTest {
  #levelsPath = './src/assets/levels/gameConfig/levels.json'
  #backgroundsPath = './src/assets/levels/backgrounds'
  #storyRU = {}
  #storyEN = {}
  
  #wrapper = null
  #backgroundItems = []
  #currentPreviewIndex = -1
  #preview = null
  
  constructor() {
    this.init()
  }
  
  init = async () => {
    const levels = await this.#loadLevels()
    await this.#loadStories()
    
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
    
    const levelKey = `lv${levelIndex}`
    
    background.dataset.src = `${this.#backgroundsPath}/back_lv${levelIndex}.webp`
    background.dataset.title = `${levelIndex} - ${spineName}`
    background.dataset.levelKey = levelKey
    
    const label = document.createElement('div')
    label.className = 'background__label'
    label.textContent = background.dataset.title
    
    const img = document.createElement('img')
    img.src = background.dataset.src
    
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
    const levelKey = currentBackground.dataset.levelKey
    
    if (!this.#preview) {
      this.#preview = document.createElement('div')
      this.#preview.className = 'preview'
      
      const title = document.createElement('div')
      title.className = 'preview__title'
      
      const img = document.createElement('img')
      img.className = 'preview__image'
      
      const story = document.createElement('div')
      story.className = 'preview__story'
      
      this.#preview.append(title, img, story)
      this.#preview.addEventListener('wheel', this.#onPreviewWheel, { passive: false })
      
      document.body.appendChild(this.#preview)
    }
    
    const title = this.#preview.querySelector('.preview__title')
    const img = this.#preview.querySelector('.preview__image')
    const story = this.#preview.querySelector('.preview__story')
    
    title.textContent = currentTitle
    img.src = currentSrc
    
    story.innerHTML = ''
    
    const ruBlock = this.#renderStoryBlock('RU', this.#storyRU[levelKey])
    const enBlock = this.#renderStoryBlock('EN', this.#storyEN[levelKey])
    
    story.append(ruBlock, enBlock)
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
  
  // ---------- story texts
  #loadStories = async () => {
    const [ruRes, enRes] = await Promise.all([
      fetch('./src/assets/levels/gameConfig/storyTexts_ru.json'),
      fetch('./src/assets/levels/gameConfig/storyTexts_en.json')
    ])
    
    this.#storyRU = await ruRes.json()
    this.#storyEN = await enRes.json()
  }
  
  #renderStoryBlock = (title, data) => {
    const container = document.createElement('div')
    container.className = 'story-block'
    
    const titleEl = document.createElement('div')
    titleEl.className = 'story-block__title'
    titleEl.textContent = title
    
    container.appendChild(titleEl)
    
    if (!data) {
      return container
    }
    
    ;['intro', 'outro'].forEach(type => {
      const section = data[type]
      
      if (!section || !section.text) {
        return
      }
      
      const sectionTitle = document.createElement('div')
      sectionTitle.className = 'story-block__section'
      sectionTitle.textContent = type
      
      container.appendChild(sectionTitle)
      
      section.text.forEach((text, i) => {
        const p = document.createElement('div')
        p.className = 'story-block__text'
        p.textContent = `${i + 1}) ${text.replace(/"/g, '')}`
        
        container.appendChild(p)
      })
    })
    
    return container
  }
}

new GameTest()
