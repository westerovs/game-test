export const createBackgroundCard = ({ src, title, levelKey }) => {
  return `
    <div class="background-card" data-src="${src}" data-title="${title}" data-level-key="${levelKey}">
      <div class="background__label">${title}</div>
      <img
        alt="${title}"
        data-src="${src}"
        loading="lazy"
        decoding="async"
      />
    </div>
  `
}
