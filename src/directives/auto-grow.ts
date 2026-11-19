import type { Directive } from 'vue'

/**
 * Sizes a textarea to its content: one line by default (its CSS `min-height`), taller as more
 * lines are typed or wrapped, up to its CSS `max-height`, after which it scrolls.
 *
 * Refits on typing, whenever the owning component re-renders (so values set from elsewhere,
 * e.g. through `v-model`, are picked up) and when the textarea's width changes (re-wrapping).
 */

const observers = new WeakMap<HTMLTextAreaElement, ResizeObserver>()
const listeners = new WeakMap<HTMLTextAreaElement, () => void>()
const widths = new WeakMap<HTMLTextAreaElement, number>()

export function fitToContent(el: HTMLTextAreaElement) {
  // Collapse first so the field can shrink, then grow to the content. With border-box sizing
  // the borders come on top of scrollHeight.
  el.style.height = 'auto'
  const style = getComputedStyle(el)
  const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) || 0
  el.style.height = `${el.scrollHeight + borders}px`
}

export const vAutoGrow: Directive<HTMLTextAreaElement> = {
  mounted(el) {
    el.rows = 1
    const fit = () => fitToContent(el)
    listeners.set(el, fit)
    el.addEventListener('input', fit)
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        // Only width changes re-wrap the text. Height changes are our own doing.
        if (widths.get(el) !== el.clientWidth) {
          widths.set(el, el.clientWidth)
          fit()
        }
      })
      observer.observe(el)
      observers.set(el, observer)
    }
    fit()
  },
  updated(el) {
    fitToContent(el)
  },
  beforeUnmount(el) {
    const fit = listeners.get(el)
    if (fit) {
      el.removeEventListener('input', fit)
    }
    observers.get(el)?.disconnect()
    observers.delete(el)
    listeners.delete(el)
    widths.delete(el)
  }
}
