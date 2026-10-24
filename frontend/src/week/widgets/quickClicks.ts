import type { MouseEvent } from 'react'

// Pressing a − or + button can make the browser start selecting text, so nearby words (like the "Grid
// Preview" heading) end up highlighted. Cancelling the press's default stops any selection from starting.
// The click itself still happens as normal.
export function keepTextUnselected(event: MouseEvent) {
  event.preventDefault()
}
