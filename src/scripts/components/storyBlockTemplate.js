export const storyBlockTemplate = ({ lang, title, data }) => {
  if (!data) {
    return `
      <div class="story-block">
        <div class="story-block__title">${title}</div>
      </div>
    `
  }
  
  const sections = ['intro', 'outro']
    .map(sectionType => {
      const section = data[sectionType]
      
      if (!section || !Array.isArray(section.text) || !section.text.length) {
        return ''
      }
      
      const rows = section.text.map((text, index) => {
        const speechId = section.speech?.[index] || ''
        const playControl = speechId
          ? `
            <button
              class="story-line__play"
              type="button"
              data-lang="${lang}"
              data-section="${sectionType}"
              data-speech-id="${speechId}"
              aria-label="play ${speechId}"
            >▶️</button>
          `
          : `
            <span class="story-line__no-audio">❌</span>
          `
        
        return `
          <div class="story-line">
            ${playControl}
            
            <p class="story-line__text">
              ${index + 1}) ${text.replace(/"/g, '')}
            </p>
          </div>
        `
      }).join('')
      
      return `
        <div class="story-block__section">${sectionType}:</div>
        ${rows}
      `
    })
    .join('')
  
  return `
    <div class="story-block">
      <div class="story-block__title">${title}</div>
      ${sections}
    </div>
  `
}
