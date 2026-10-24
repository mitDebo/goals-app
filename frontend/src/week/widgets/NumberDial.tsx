import { useRef, useState, type PointerEvent } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { NumberSettings } from '@/week/goalKinds'
import { clampToRange, roundToStep } from '@/week/numbers'
import { keepTextUnselected } from '@/week/widgets/quickClicks'

const SIZE = 200 // the dial's drawing is 200×200
const CENTRE = SIZE / 2
const TRACK_R = 80 // radius of the track the knob runs along
const SWEEP = 270 // a knob's travel, in degrees: from bottom-left (−135°) over the top to bottom-right (+135°)
const STEPS_PER_TURN = 10 // an endless dial: one full turn adds (or takes off) this many steps
const DEG_PER_STEP = 360 / STEPS_PER_TURN

// Angles are in degrees, clockwise from 12 o'clock. A point on a circle around the centre:
const at = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: CENTRE + r * Math.sin(rad), y: CENTRE - r * Math.cos(rad) }
}
// An SVG arc along the circle from one angle to another (clockwise).
const arc = (from: number, to: number, r: number) => {
  const a = at(from, r)
  const b = at(to, r)
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${b.x} ${b.y}`
}
// The angle of the pointer around the dial's centre (−180 to 180).
const pointerAngle = (event: PointerEvent<SVGSVGElement>) => {
  const box = event.currentTarget.getBoundingClientRect()
  const dx = event.clientX - (box.left + box.width / 2)
  const dy = event.clientY - (box.top + box.height / 2)
  return (Math.atan2(dx, -dy) * 180) / Math.PI
}

// A dial for recording a number.
// - Both ends set: a volume knob. Min is at the bottom-left, max at the bottom-right; it fills an arc up to
//   the value and stops at both ends. Drag anywhere on it and the value follows your finger.
// - An end open: an endless dial. Each full turn adds 10 steps (turning back takes them off); it stops at
//   an end that is set.
// − and + beside it nudge one step; on the keyboard, the arrow keys do.
export function NumberDial({
  id,
  value,
  onChange,
  settings,
  compact = false,
}: {
  id: string
  value: number
  onChange: (value: number) => void
  settings: NumberSettings
  // Smaller, for tight spots like the preview on a phone.
  compact?: boolean
}) {
  const { min, max, step, unit, minLabel, maxLabel } = settings
  const knob = min !== undefined && max !== undefined
  const set = (next: number) => onChange(clampToRange(roundToStep(next, step), settings))

  // Endless dial: how far it's been turned (so the marker follows your finger smoothly), and the part of a
  // step's turn not yet used up.
  const [spin, setSpin] = useState(0)
  const drag = useRef<{ lastAngle: number; leftover: number; value: number } | null>(null)

  const nudge = (steps: number) => {
    set(value + steps * step)
    if (!knob) setSpin((s) => s + steps * DEG_PER_STEP)
  }

  // Knob: where the value sits on the sweep.
  const fraction = knob ? (value - min) / (max - min) : 0
  const valueAngle = -SWEEP / 2 + fraction * SWEEP
  const markerAngle = knob ? valueAngle : spin

  // Knob ticks: one per step if there aren't too many, otherwise ten evenly spaced. An endless dial's ten
  // ticks turn with it, like a real knob.
  const tickCount = knob ? Math.min(Math.round((max - min) / step), 40) : STEPS_PER_TURN
  const ticks = Array.from({ length: knob ? tickCount + 1 : STEPS_PER_TURN }, (_, i) =>
    knob ? -SWEEP / 2 + (i / tickCount) * SWEEP : i * DEG_PER_STEP + spin,
  )

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    const angle = pointerAngle(event)
    // The drag keeps its own running value, so several quick moves in a row each build on the last.
    drag.current = { lastAngle: angle, leftover: 0, value }
    if (knob) moveKnobTo(angle)
  }
  const moveKnobTo = (angle: number) => {
    // The gap at the bottom between the two ends belongs to whichever end is nearer.
    const clamped = Math.max(
      -SWEEP / 2,
      Math.min(SWEEP / 2, Math.abs(angle) > SWEEP / 2 ? Math.sign(angle) * 180 : angle),
    )
    set(min! + ((clamped + SWEEP / 2) / SWEEP) * (max! - min!))
  }
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d) return
    const angle = pointerAngle(event)
    if (knob) return moveKnobTo(angle)
    // Endless: how far it turned since last time (the short way round), added to what's left over.
    let turned = angle - d.lastAngle
    if (turned > 180) turned -= 360
    if (turned < -180) turned += 360
    d.lastAngle = angle
    d.leftover += turned
    const steps = Math.trunc(d.leftover / DEG_PER_STEP)
    if (steps !== 0) {
      const next = clampToRange(roundToStep(d.value + steps * step, step), settings)
      d.leftover -= steps * DEG_PER_STEP
      // At an end that's set, it stops: forget the extra turning, so turning back works straight away.
      if (next === d.value) d.leftover = 0
      else {
        d.value = next
        onChange(next)
      }
    }
    setSpin((s) => s + turned)
  }
  const endDrag = () => (drag.current = null)

  const marker = at(markerAngle, TRACK_R)
  const nudgeButton = `flex ${compact ? 'size-8' : 'size-10'} shrink-0 items-center justify-center rounded-full border bg-background hover:bg-accent`

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Less"
          onMouseDown={keepTextUnselected}
          onClick={() => nudge(-1)}
          className={nudgeButton}
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <svg
          id={id}
          role="slider"
          tabIndex={0}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={`${value}${unit ? ` ${unit}` : ''}`}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={`group ${compact ? 'size-36' : 'size-48'} cursor-grab touch-none select-none focus:outline-none active:cursor-grabbing`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nudge(1)
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nudge(-1)
            else return
            event.preventDefault()
          }}
        >
          {/* The dial's face, and a ring around it when it has the keyboard's focus. */}
          <circle cx={CENTRE} cy={CENTRE} r={TRACK_R + 12} className="fill-muted stroke-border" />
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={TRACK_R + 15}
            className="hidden fill-none stroke-ring group-focus-visible:inline"
            strokeWidth={3}
          />
          {/* Ticks around the edge. */}
          {ticks.map((deg, i) => {
            const a = at(deg, TRACK_R + 10)
            const b = at(deg, TRACK_R + 4)
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="stroke-muted-foreground/60"
                strokeWidth={1.5}
              />
            )
          })}
          {knob && (
            <>
              {/* The knob's track, and the filled part up to the value. */}
              <path
                d={arc(-SWEEP / 2, SWEEP / 2, TRACK_R)}
                className="fill-none stroke-foreground/15"
                strokeWidth={8}
                strokeLinecap="round"
              />
              {fraction > 0 && (
                <path
                  d={arc(-SWEEP / 2, valueAngle, TRACK_R)}
                  className="fill-none stroke-primary"
                  strokeWidth={8}
                  strokeLinecap="round"
                />
              )}
            </>
          )}
          {/* The marker: where the dial is pointing. */}
          <circle cx={marker.x} cy={marker.y} r={10} className="fill-primary stroke-background" strokeWidth={3} />
          {/* The value in the middle. */}
          <text
            x={CENTRE}
            y={CENTRE + (unit ? 2 : 10)}
            textAnchor="middle"
            className="fill-foreground text-[34px] font-semibold"
          >
            {value}
          </text>
          {unit && (
            <text x={CENTRE} y={CENTRE + 24} textAnchor="middle" className="fill-muted-foreground text-[13px]">
              {unit}
            </text>
          )}
          {/* A knob's ends, under the start and end of the sweep. */}
          {knob && (
            <>
              <text
                x={at(-SWEEP / 2, TRACK_R).x}
                y={SIZE - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px]"
              >
                {min}
              </text>
              <text
                x={at(SWEEP / 2, TRACK_R).x}
                y={SIZE - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px]"
              >
                {max}
              </text>
            </>
          )}
        </svg>
        <button
          type="button"
          aria-label="More"
          onMouseDown={keepTextUnselected}
          onClick={() => nudge(1)}
          className={nudgeButton}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
      {knob && (minLabel || maxLabel) && (
        <div className={`flex w-full justify-between ${compact ? 'px-8' : 'px-12'} text-xs text-muted-foreground`}>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}
