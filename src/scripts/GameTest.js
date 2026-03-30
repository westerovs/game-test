import {createBackgroundCard} from './components/backgroundCardTemplate.js'
import {previewTemplate} from './components/previewTemplate.js'
import {storyBlockTemplate} from './components/storyBlockTemplate.js'
import {DEFAULT_VIEW_MODE, GAME_CONFIG} from './config.js'

export default class GameTest {
  #gameFolder
  #levelsPath
  #backgroundsPath
  #stories = {}
  #languages = []
  #unavailableSpeech = new Set()
  
  #wrapper
  #cards
  #cardsList
  #modeButtons = []
  #currentMode = 'showcase'
  #backgroundItems = []
  #currentPreviewIndex = -1
  #preview = null
  
  #speechBasePath
  #audio = null
  #activePlayBtn = null
  #imageObserver = null
  #isDestroyed = false
  
  constructor({gameKey}) {
    const gameConfig = GAME_CONFIG[gameKey]
    
    if (!gameConfig) {
      throw new Error(`Game config not found: ${gameKey}`)
    }
    
    this.#gameFolder = gameConfig.folder
    this.#languages = gameConfig.languages
    this.#levelsPath = `./src/games/${this.#gameFolder}/assets/gameConfig/levels.json`
    this.#backgroundsPath = `./src/games/${this.#gameFolder}/assets/levels/backgrounds`
    this.#speechBasePath = `./src/games/${this.#gameFolder}/assets/speech`
    
    this.#wrapper = document.querySelector('.wrapper')
    this.#cards = this.#wrapper.querySelector('.cards')
    this.#cardsList = this.#wrapper.querySelector('.cards-list')
    this.#modeButtons = [...this.#wrapper.querySelectorAll('.mode-button')]
    
    this.init()
  }
  
  init = async () => {
    this.#isDestroyed = false
    
    this.#reset()
    
    const levels = await this.#loadLevels()
    if (this.#isDestroyed) return
    
    await this.#loadStories()
    if (this.#isDestroyed) return
    
    await this.#cacheUnavailableSpeech()
    if (this.#isDestroyed) return
    
    this.#createImageObserver()
    this.#renderBackgroundCards(levels)
    
    this.#setEvents(true)
    this.#setMode(DEFAULT_VIEW_MODE)
  }
  
  destroy = () => {
    this.#isDestroyed = true
    
    this.#setEvents(false)
    this.#stopSpeech()
    this.#closePreview()
    
    if (this.#imageObserver) {
      this.#imageObserver.disconnect()
      this.#imageObserver = null
    }
    
    this.#cards.innerHTML = ''
    this.#cardsList.innerHTML = ''
    this.#cards.classList.remove('visually-hidden')
    this.#cardsList.classList.add('visually-hidden')
    
    this.#backgroundItems = []
    this.#stories = {}
    this.#unavailableSpeech.clear()
    this.#currentPreviewIndex = -1
    this.#currentMode = 'showcase'
  }
  
  #reset = () => {
    this.#cards.innerHTML = ''
    this.#cardsList.innerHTML = ''
    this.#stories = {}
    this.#backgroundItems = []
    this.#unavailableSpeech.clear()
    this.#currentMode = 'showcase'
    this.#currentPreviewIndex = -1
    
    this.#closePreview()
  }
  
  #setEvents = (bool) => {
    const isEnabled = bool ? 'addEventListener' : 'removeEventListener'
    
    this.#wrapper[isEnabled]('click', this.#onBackgroundClick)
    this.#wrapper[isEnabled]('click', this.#onModeButtonClick)
    this.#cardsList[isEnabled]('click', this.#onPreviewContentClick)
    document[isEnabled]('click', this.#onPreviewClick)
    document[isEnabled]('keydown', this.#onDocumentKeydown)
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
    if (this.#currentMode !== 'showcase') {
      return
    }
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
      
      this.#preview.addEventListener('wheel', this.#onPreviewWheel, {passive: false})
      this.#preview.addEventListener('click', this.#onPreviewContentClick)
      
      document.body.appendChild(this.#preview)
    }
    
    const title = this.#preview.querySelector('.preview__title')
    const img = this.#preview.querySelector('.preview__image')
    const story = this.#preview.querySelector('.preview__story')
    
    title.textContent = currentTitle
    img.src = currentSrc
    story.innerHTML = ''
    
    const blocks = this.#languages.map(({code, title}) => {
      return this.#renderStoryBlock(code, title, this.#stories[code]?.[levelKey])
    })
    
    story.append(...blocks)
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
  
  #onPreviewWheel = (event) => {
    // игнорируем wheel внутри блока со скроллом
    if (event.target.closest('.preview__story')) {
      return
    }
    
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
    const entries = await Promise.all(
      this.#languages.map(async ({code}) => {
        const res = await fetch(`./src/games/${this.#gameFolder}/assets/gameConfig/storyTexts_${code}.json`)
        
        if (!res.ok) {
          return [code, {}]
        }
        
        return [code, await res.json()]
      })
    )
    
    this.#stories = Object.fromEntries(entries)
  }
  
  #renderStoryBlock = (lang, title, data) => {
    const preparedData = this.#getPreparedStoryData(lang, data)
    const html = storyBlockTemplate({lang, title, data: preparedData})
    
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    
    return template.content.firstElementChild
  }
  
  
  // ---------- audio
  #playSpeech = async (playBtn, lang, section, speechId) => {
    if (!speechId || !this.#isSpeechAvailable(lang, section, speechId)) {
      this.#replacePlayBtnWithNoAudio(playBtn)
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
      
      this.#unavailableSpeech.add(this.#getSpeechKey(lang, section, speechId))
      this.#replacePlayBtnWithNoAudio(playBtn)
    }
    
    audio.addEventListener('error', handleAudioError, {once: true})
    audio.addEventListener('ended', this.#onAudioEnded, {once: true})
    
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
  
  #cacheUnavailableSpeech = async () => {
    const checks = []
    const addedKeys = new Set()
    
    const appendChecks = (lang, storyMap) => {
      Object.values(storyMap).forEach(levelData => {
        ;['intro', 'outro'].forEach(section => {
          const speechList = levelData?.[section]?.speech
          
          if (!Array.isArray(speechList)) {
            return
          }
          
          speechList.forEach(speechId => {
            if (!speechId) {
              return
            }
            
            const key = this.#getSpeechKey(lang, section, speechId)
            
            if (addedKeys.has(key)) {
              return
            }
            
            addedKeys.add(key)
            
            checks.push(
              fetch(this.#getSpeechSrc(lang, section, speechId), {method: 'HEAD'})
                .then(res => {
                  if (!res.ok) {
                    this.#unavailableSpeech.add(key)
                  }
                })
                .catch(() => {
                  this.#unavailableSpeech.add(key)
                })
            )
          })
        })
      })
    }
    
    this.#languages.forEach(({code}) => {
      appendChecks(code, this.#stories[code] || {})
    })
    
    await Promise.all(checks)
  }
  
  #getPreparedStoryData = (lang, data) => {
    if (!data) {
      return data
    }
    
    const preparedData = structuredClone(data)
    
    ;['intro', 'outro'].forEach(section => {
      const speechList = preparedData?.[section]?.speech
      
      if (!Array.isArray(speechList)) {
        return
      }
      
      preparedData[section].speech = speechList.map(speechId => {
        if (!speechId) {
          return ''
        }
        
        return this.#isSpeechAvailable(lang, section, speechId) ? speechId : ''
      })
    })
    
    return preparedData
  }
  
  #getSpeechKey = (lang, section, speechId) => {
    return `${lang}:${section}:${speechId}`
  }
  
  #isSpeechAvailable = (lang, section, speechId) => {
    return !this.#unavailableSpeech.has(this.#getSpeechKey(lang, section, speechId))
  }
  
  #replacePlayBtnWithNoAudio = playBtn => {
    if (!playBtn?.parentNode) {
      return
    }
    
    const noAudio = document.createElement('span')
    noAudio.className = 'story-line__no-audio'
    noAudio.textContent = '❌'
    
    playBtn.replaceWith(noAudio)
    
    if (this.#activePlayBtn === playBtn) {
      this.#activePlayBtn = null
    }
  }
  
  
  // ---------- lazy loading
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
  
  
  // ---------- mode buttons
  #onModeButtonClick = event => {
    const modeButton = event.target.closest('.mode-button')
    
    if (!modeButton || !this.#wrapper.contains(modeButton)) {
      return
    }
    
    const {mode} = modeButton.dataset
    
    if (!mode || mode === this.#currentMode) {
      return
    }
    
    this.#setMode(mode)
  }
  
  #setMode = mode => {
    if (mode !== 'showcase' && mode !== 'list') {
      return
    }
    
    this.#stopSpeech()
    this.#closePreview()
    
    this.#currentMode = mode
    this.#updateModeButtons()
    
    if (mode === 'showcase') {
      this.#cards.classList.remove('visually-hidden')
      this.#cardsList.classList.add('visually-hidden')
      return
    }
    
    this.#cards.classList.add('visually-hidden')
    
    if (!this.#cardsList.childElementCount) {
      this.#renderCardsList()
    }
    
    this.#cardsList.classList.remove('visually-hidden')
  }
  
  #updateModeButtons = () => {
    this.#modeButtons.forEach(button => {
      button.classList.toggle('btn-is-active', button.dataset.mode === this.#currentMode)
    })
  }
  
  #createCardsListItem = background => {
    const title = background.dataset.title
    const levelKey = background.dataset.levelKey
    
    const item = document.createElement('section')
    item.className = 'cards-list__item'
    
    const titleEl = document.createElement('p')
    titleEl.className = 'cards-list__title'
    titleEl.textContent = title
    
    const content = document.createElement('div')
    content.className = 'cards-list__content'
    
    const blocks = this.#languages.map(({code, title}) => {
      return this.#renderStoryBlock(code, title, this.#stories[code]?.[levelKey])
    })
    
    content.append(...blocks)
    item.append(titleEl, content)
    
    return item
  }
  
  #renderCardsList = () => {
    this.#cardsList.innerHTML = ''
    
    this.#backgroundItems.forEach(background => {
      const item = this.#createCardsListItem(background)
      this.#cardsList.appendChild(item)
    })
  }
  
}
