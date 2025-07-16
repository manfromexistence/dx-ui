export function initialViewportState(rect: DOMRect) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  return rect.top < viewportHeight && rect.bottom > 0 && rect.left < viewportWidth && rect.right > 0
}
