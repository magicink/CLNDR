export function createContainer(width = 640): HTMLElement {
  const el = document.createElement('div')
  el.style.maxWidth = `${width}px`
  el.style.margin = '1rem auto'
  return el
}
