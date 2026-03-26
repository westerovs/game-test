import {createBackgroundCard} from './scripts/components/backgroundCardTemplate.js'
import {previewTemplate} from './scripts/components/previewTemplate.js'
import {storyBlockTemplate} from './scripts/components/storyBlockTemplate.js'

class GameTest {
  #levelsPath = './src/assets/levels/gameConfig/levels.json'
  #backgroundsPath = './src/assets/levels/backgrounds'
  #storyRU = {}
  #storyEN = {}
  
  #wrapper
  #cards
  #backgroundItems = []
  #currentPreviewIndex = -1
  #preview = null
  
  #speechBasePath = './src/assets/speech'
  #audio = null
  #audioNotFoundMessage = 'Аудио не найдено'
  #activePlayBtn = null
  #imageObserver = null
  
  constructor() {
    this.#wrapper = document.querySelector('.wrapper')
    this.#cards = this.#wrapper.querySelector('.cards')
    
    this.init()
  }
  
  init = async () => {
    const levels = await this.#loadLevels()
    await this.#loadStories()
    
    this.#createImageObserver()
    this.#renderBackgroundCards(levels)
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
  
  #renderBackgroundCards = levels => {
    this.#backgroundItems = []

    Object.keys(levels).forEach(levelKey => {
      const levelIndex = levelKey.replace('level', '')
      const levelData = levels[levelKey]
      
      const background = this.#createBackgroundItem(levelIndex, levelData.spineName)
      
      this.#backgroundItems.push(background)
      this.#cards.appendChild(background)
    })
  }
  
  #createBackgroundItem = (levelIndex, spineName) => {
    const levelKey = `lv${levelIndex}`
    const src = `${this.#backgroundsPath}/back_lv${levelIndex}.webp`
    const title = `${levelIndex} - ${spineName}`
    
    const card = createBackgroundCard({src, title, levelKey})
    
    const template = document.createElement('template')
    template.innerHTML = card.trim()
    
    const background = template.content.firstElementChild
    const img = background.querySelector('img')
    
    this.#imageObserver.observe(img)
    
    return background
  }
  
  #onBackgroundClick = event => {
    const background = event.target.closest('.background-card')
    
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
  
  // --------- preview
  #openPreview = () => {
    const currentBackground = this.#backgroundItems[this.#currentPreviewIndex]
    
    if (!currentBackground) {
      return
    }
    
    this.#stopSpeech()
    
    const currentSrc = currentBackground.dataset.src
    const currentTitle = currentBackground.dataset.title
    const levelKey = currentBackground.dataset.levelKey
    
    if (!this.#preview) {
      const html = previewTemplate()
      
      const template = document.createElement('template')
      template.innerHTML = html.trim()
      
      this.#preview = template.content.firstElementChild
      
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
  
  #onPreviewContentClick = event => {
    const playBtn = event.target.closest('.story-line__play')
    
    if (!playBtn) {
      return
    }
    
    event.stopPropagation()
    
    this.#playSpeech(
      playBtn,
      playBtn.dataset.lang,
      playBtn.dataset.section,
      playBtn.dataset.speechId
    )
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
    const html = storyBlockTemplate({ lang, title, data })
    
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    
    return template.content.firstElementChild
  }
  
  // ---------- audio
  #playSpeech = async (playBtn, lang, section, speechId) => {
    if (!speechId) {
      alert(this.#audioNotFoundMessage)
      return
    }
    
    if (this.#audio && this.#activePlayBtn === playBtn) {
      this.#stopSpeech()
      return
    }
    
    const src = this.#getSpeechSrc(lang, section, speechId)
    const audio = new Audio(src)
    
    this.#stopSpeech()
    
    this.#audio = audio
    this.#activePlayBtn = playBtn
    this.#setPlayBtnState(playBtn, true)
    
    let isHandled = false
    
    const handleAudioError = () => {
      if (isHandled) {
        return
      }
      
      isHandled = true
      this.#stopSpeech()
      alert(this.#audioNotFoundMessage)
    }
    
    audio.addEventListener('error', handleAudioError, { once: true })
    audio.addEventListener('ended', this.#onAudioEnded, { once: true })
    
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
    if (this.#audio) {
      this.#audio.pause()
      this.#audio.currentTime = 0
      this.#audio = null
    }
    
    if (this.#activePlayBtn) {
      this.#setPlayBtnState(this.#activePlayBtn, false)
      this.#activePlayBtn = null
    }
  }
  

  #onAudioEnded = () => {
    this.#stopSpeech()
  }
  
  #setPlayBtnState = (playBtn, isPlaying) => {
    if (!playBtn) {
      return
    }
    
    playBtn.textContent = isPlaying ? '⏸️' : '▶️'
  }
  
  // lazy loading
  #createImageObserver = () => {
    this.#imageObserver = new IntersectionObserver(this.#onImageIntersect, {
      root: null,
      rootMargin: '300px 0px',
      threshold: 0.01
    })
  }
  
  #onImageIntersect = entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return
      }
      
      const img = entry.target
      
      if (!img.dataset.src) {
        this.#imageObserver.unobserve(img)
        return
      }
      
      img.src = img.dataset.src
      img.removeAttribute('data-src')
      
      this.#imageObserver.unobserve(img)
    })
  }

}

new GameTest()
