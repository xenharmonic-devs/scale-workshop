/**
 * The Build Scale side panel holds one docked card at a time, but cards are opened from separate
 * menus (New scale, Modify scale). Each menu claims the panel when it opens a card, which closes
 * the card the previous owner left there (reverting any live preview it applied).
 */
let closeCurrent: (() => void) | null = null

export function claimDock(close: () => void) {
  const previous = closeCurrent
  closeCurrent = close
  if (previous && previous !== close) {
    previous()
  }
}
