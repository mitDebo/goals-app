import type { NumberSettings } from '@/week/goalKinds'

// A slider from the goal's min to its max (both must be set), moving in the goal's steps. The value shows
// big above it; the ends (with their labels, if any) sit underneath.
export function NumberSlider({
  id,
  value,
  onChange,
  settings,
}: {
  id: string
  value: number
  onChange: (value: number) => void
  settings: NumberSettings & { min: number; max: number }
}) {
  const { min, max, step, unit, minLabel, maxLabel } = settings
  return (
    <div className="flex flex-col gap-2">
      <p aria-hidden="true" className="text-center text-3xl font-semibold">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={`${value}${unit ? ` ${unit}` : ''}`}
        className="h-8 w-full cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {min}
          {minLabel && ` · ${minLabel}`}
        </span>
        <span>
          {maxLabel && `${maxLabel} · `}
          {max}
        </span>
      </div>
    </div>
  )
}
