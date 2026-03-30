const GAME_CONFIG = {
  detective: {
    folder: 'detective',
    languages: [
      {code: 'ru', title: 'RU'},
      {code: 'en', title: 'EN'}
    ]
  },
  hotel: {
    folder: 'hotel',
    languages: [
      {code: 'ru', title: 'RU'},
      {code: 'en', title: 'EN'},
      {code: 'de', title: 'DE'}
    ]
  }
}

const DEFAULT_GAME_KEY = GAME_CONFIG.hotel.folder
const DEFAULT_VIEW_MODE = 'list'

export {
  GAME_CONFIG,
  DEFAULT_GAME_KEY,
  DEFAULT_VIEW_MODE,
}
