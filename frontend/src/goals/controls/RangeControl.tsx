import type { KeyboardEvent, PointerEvent } from 'react'
import { emojiFaces, type RangeStyle } from '@/goals/rangeRules'

type Props = {
  style: RangeStyle
  min: number
  max: number
  // The chosen value, or undefined when nothing is chosen yet.
  value: number | undefined
  onChange: (value: number) => void
}

// The on-screen control for a range goal. Same values, different ways of picking one:
// the style never changes what gets stored.
export function RangeControl(props: Props) {
  switch (props.style) {
    case 'buttons':
      return <ValueButtons {...props} faceFor={(v) => String(v)} />
    case 'emoji_scale': {
      const faces = emojiFaces(props.max - props.min + 1)
      return <ValueButtons {...props} faceFor={(v) => faces[v - props.min]} />
    }
    case 'slider':
      return <Slider {...props} />
    case 'dial':
      return <Dial {...props} />
    case 'stepper':
      return <Stepper {...props} />
  }
}

const valuesFrom = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i)

// One button per value (also used for the emoji scale, with faces instead of numbers).
function ValueButtons({ min, max, value, onChange, faceFor }: Props & { faceFor: (value: number) => string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {valuesFrom(min, max).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          title={String(v)}
          onClick={() => onChange(v)}
          className={`min-w-9 rounded-md border px-2 py-1 ${value === v ? 'bg-primary text-primary-foreground' : ''}`}
        >
          {faceFor(v)}
        </button>
      ))}
    </div>
  )
}

function Slider({ min, max, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        aria-label="Slider"
        min={min}
        max={max}
        step={1}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span>{value ?? '–'}</span>
    </div>
  )
}

// A knob that turns through 270°, like a volume dial. Drag/click to set, or use the arrow keys.
function Dial({ min, max, value, onChange }: Props) {
  const current = value ?? min
  const angle = -135 + ((current - min) / (max - min)) * 270

  const setFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const dx = event.clientX - (box.left + box.width / 2)
    const dy = event.clientY - (box.top + box.height / 2)
    // 0° points straight up; clamp to the dial's 270° sweep.
    const degrees = Math.max(-135, Math.min(135, (Math.atan2(dx, -dy) * 180) / Math.PI))
    onChange(Math.round(min + ((degrees + 135) / 270) * (max - min)))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key]
    if (step === undefined) return
    event.preventDefault()
    onChange(Math.max(min, Math.min(max, current + step)))
  }

  return (
    <div
      role="slider"
      aria-label="Dial"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={current}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={setFromPointer}
      className="relative size-20 cursor-pointer rounded-full border-2 focus:outline-2"
    >
      <div
        className="absolute left-1/2 top-1/2 h-8 w-0.5 origin-bottom bg-foreground"
        style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
      />
      <span className="absolute inset-x-0 bottom-1 text-center text-xs">{value ?? '–'}</span>
    </div>
  )
}

function Stepper({ min, max, value, onChange }: Props) {
  const current = value ?? min
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Decrease" disabled={current <= min} onClick={() => onChange(current - 1)} className="rounded-md border px-3 py-1 disabled:opacity-50">
        −
      </button>
      <output role="status" className="min-w-8 text-center">
        {current}
      </output>
      <button type="button" aria-label="Increase" disabled={current >= max} onClick={() => onChange(current + 1)} className="rounded-md border px-3 py-1 disabled:opacity-50">
        +
      </button>
    </div>
  )
}
