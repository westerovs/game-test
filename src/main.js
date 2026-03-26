class GameTest {
  #levelsPath = './src/assets/levels/gameConfig/levels.json'
  #backgroundsPath = './src/assets/levels/backgrounds'
  #storyRU = {}
  #storyEN = {}
  
  #wrapper = null
  #backgroundItems = []
  #currentPreviewIndex = -1
  #preview = null
  
  #speechBasePath = './src/assets/speech'
  #audio = null
  #audioNotFoundMessage = 'Аудио не найдено'
  
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
      img.alt = 'preview'
      
      const story = document.createElement('div')
      story.className = 'preview__story'
      
      this.#preview.append(title, img, story)
      this.#preview.addEventListener('wheel', this.#onPreviewWheel, { passive: false })
      this.#preview.addEventListener('click', this.#onPreviewContentClick)
      
      document.body.appendChild(this.#preview)
    }
    
    const title = this.#preview.querySelector('.preview__title')
    const img = this.#preview.querySelector('.preview__image')
    const story = this.#preview.querySelector('.preview__story')
    
    title.textContent = currentTitle
    img.src = currentSrc
    story.innerHTML = ''
    
    const ruBlock = this.#renderStoryBlock('ru', 'RU', this.#storyRU[levelKey])
    const enBlock = this.#renderStoryBlock('en', 'EN', this.#storyEN[levelKey])
    
    story.append(ruBlock, enBlock)
  }
  
  #closePreview = () => {
    if (!this.#preview) {
      return
    }
    
    this.#stopSpeech()
    
    this.#preview.removeEventListener('wheel', this.#onPreviewWheel)
    this.#preview.removeEventListener('click', this.#onPreviewContentClick)
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
  
  #renderStoryBlock = (lang, title, data) => {
    const container = document.createElement('div')
    container.className = 'story-block'
    
    const titleEl = document.createElement('div')
    titleEl.className = 'story-block__title'
    titleEl.textContent = title
    
    container.appendChild(titleEl)
    
    if (!data) {
      return container
    }
    
    ;['intro', 'outro'].forEach(sectionType => {
      const section = data[sectionType]
      
      if (!section || !Array.isArray(section.text) || !section.text.length) {
        return
      }
      
      const sectionTitle = document.createElement('div')
      sectionTitle.className = 'story-block__section'
      sectionTitle.textContent = `${sectionType}:`
      
      container.appendChild(sectionTitle)
      
      section.text.forEach((text, index) => {
        const speechId = section.speech?.[index] || ''
        
        const row = document.createElement('div')
        row.className = 'story-line'
        
        const playBtn = document.createElement('button')
        playBtn.className = 'story-line__play'
        playBtn.type = 'button'
        playBtn.textContent = '▶️'
        playBtn.dataset.lang = lang
        playBtn.dataset.section = sectionType
        playBtn.dataset.speechId = speechId
        playBtn.setAttribute('aria-label', `play ${speechId || 'audio'}`)
        
        const textEl = document.createElement('div')
        textEl.className = 'story-line__text'
        textEl.textContent = `${index + 1}) ${text.replace(/"/g, '')}`
        
        row.append(playBtn, textEl)
        container.appendChild(row)
      })
    })
    
    return container
  }
  // ---------- audio
  #onPreviewContentClick = event => {
    const playBtn = event.target.closest('.story-line__play')
    
    if (!playBtn) {
      return
    }
    
    event.stopPropagation()
    
    this.#playSpeech(
      playBtn.dataset.lang,
      playBtn.dataset.section,
      playBtn.dataset.speechId
    )
  }
  
  #playSpeech = async (lang, section, speechId) => {
    if (!speechId) {
      alert(this.#audioNotFoundMessage)
      return
    }
    
    const src = this.#getSpeechSrc(lang, section, speechId)
    const audio = new Audio(src)
    
    this.#stopSpeech()
    this.#audio = audio
    
    let isHandled = false
    
    const handleAudioError = () => {
      if (isHandled) {
        return
      }
      
      isHandled = true
      this.#audio = null
      alert(this.#audioNotFoundMessage)
    }
    
    audio.addEventListener('error', handleAudioError, { once: true })
    audio.addEventListener('ended', () => {
      if (this.#audio === audio) {
        this.#audio = null
      }
    }, { once: true })
    
    try {
      await audio.play()
    } catch {
      handleAudioError()
    }
  }
  
  #getSpeechSrc = (lang, section, speechId) => {
    return `${this.#speechBasePath}/${lang}/${section}/${speechId}.mp3`
  }
  
  #stopSpeech = () => {
    if (!this.#audio) {
      return
    }
    
    this.#audio.pause()
    this.#audio.currentTime = 0
    this.#audio = null
  }
  
}

new GameTest()
