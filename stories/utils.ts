export function createContainer(width = 640): HTMLElement {
  const el = document.createElement('div')
  el.style.maxWidth = `${width}px`
  el.style.margin = '1rem auto'
  // Scope any demo-level element styles (h4, p, etc.)
  el.classList.add('clndr-demo')
  return el
}
