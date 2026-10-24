import { Minus, Plus } from 'lucide-react'
import type { NumberSettings } from '@/week/goalKinds'
import { clampToRange, roundToStep } from '@/week/numbers'
import { keepTextUnselected } from '@/week/widgets/quickClicks'

// Plain entry: a number box with − and + on either side (one step each, kept within min and max), and the
// unit after it. `text` is what's in the box (it can be part-typed, like "3."), so the box owns its text.
export function NumberEntry({
  id,
  text,
  onChange,
  settings,
}: {
  id: string
  text: string
  onChange: (text: string) => void
  settings: NumberSettings
}) {
  const nudge = (steps: number) => {
    const current = Number(text)
    const from = text.trim() === '' || Number.isNaN(current) ? 0 : current
    onChange(String(clampToRange(roundToStep(from + steps * settings.step, settings.step), settings)))
  }
  const button = 'flex size-11 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-accent'

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Less"
        onMouseDown={keepTextUnselected}
        onClick={() => nudge(-1)}
        className={button}
      >
        <Minus aria-hidden="true" className="size-5" />
      </button>
      <input
        id={id}
        inputMode="decimal"
        value={text}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-24 rounded-md border border-gray-300 bg-white text-center text-2xl font-semibold text-gray-900 [color-scheme:light]"
      />
      <button
        type="button"
        aria-label="More"
        onMouseDown={keepTextUnselected}
        onClick={() => nudge(1)}
        className={button}
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>
      {settings.unit && <span className="text-sm text-muted-foreground">{settings.unit}</span>}
    </div>
  )
}
