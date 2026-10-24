import { useRef } from 'react'
import { GripVertical } from 'lucide-react'

type Props = {
  // Which end of the plan this grip is on. The end grip adds days when dragged right; the start grip
  // adds days (before the start) when dragged left.
  edge: 'start' | 'end'
  length: number
  onChange: (length: number) => void
  // How far the pointer has to move sideways to add or remove one day: one day column's width.
  stepPx: number
  // How far it has to move up or down to add or remove a whole week: one week block's height.
  weekStepPx: number
  heightPx: number
  min?: number
  max?: number
}

// A grip at one end of the plan. Drag it outward to add days, inward to remove them: sideways for a day
// per column, up or down for a week per week block. With the keyboard, focus it and use the arrow keys
// (← → a day, ↑ ↓ a week). Works with a mouse or a finger.
//
// While dragging, it remembers where the drag started and how long the plan was then, and sets the length
// to that plus however far the pointer has moved outward, counted in columns and week blocks.
export function LengthHandle({ edge, length, onChange, stepPx, weekStepPx, heightPx, min = 1, max = 366 }: Props) {
  // Outward is right and down for the end grip, left and up for the start grip.
  const outward = edge === 'end' ? 1 : -1
  const drag = useRef<{ startX: number; startY: number; startLength: number } | null>(null)
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const change = (next: number) => {
    if (clamp(next) !== length) onChange(clamp(next))
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={edge === 'end' ? 'Plan end (drag to change the length)' : 'Plan start (drag to change the length)'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={length}
      aria-valuetext={`${length} ${length === 1 ? 'day' : 'days'}`}
      onPointerDown={(event) => {
        // "Capture" keeps the drag going even if the pointer slips off the grip.
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { startX: event.clientX, startY: event.clientY, startLength: length }
      }}
      onPointerMove={(event) => {
        if (!drag.current) return
        const columnsMoved = Math.round((event.clientX - drag.current.startX) / stepPx)
        const weeksMoved = Math.round((event.clientY - drag.current.startY) / weekStepPx)
        change(drag.current.startLength + (columnsMoved + weeksMoved * 7) * outward)
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') change(length + outward)
        else if (event.key === 'ArrowLeft') change(length - outward)
        else if (event.key === 'ArrowDown') change(length + 7 * outward)
        else if (event.key === 'ArrowUp') change(length - 7 * outward)
        else return
        event.preventDefault()
      }}
      // touch-none: on a phone, dragging the grip resizes the plan instead of scrolling the page.
      className="flex w-5 cursor-move touch-none items-center justify-center rounded-md bg-accent text-muted-foreground select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:bg-primary active:text-primary-foreground"
      style={{ height: heightPx }}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </div>
  )
}
