import type { NumberSettings } from '@/week/goalKinds'

// How many decimal places a step uses (1 → 0, 0.5 → 1, 0.1 → 1).
const places = (step: number) => (String(step).split('.')[1] ?? '').length

// Rounds to the nearest step (and cleans up floating-point leftovers like 0.30000000000000004).
export const roundToStep = (value: number, step: number) => Number((Math.round(value / step) * step).toFixed(places(step)))

// Keeps a value inside the goal's min and max (either can be missing).
export const clampToRange = (value: number, { min, max }: NumberSettings) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value))

// Where a new value starts: the middle (rounded down to a step) when both ends are set; otherwise 0, or the
// nearest end if 0 isn't allowed.
export function startingValue(settings: NumberSettings) {
  const { min, max, step } = settings
  if (min !== undefined && max !== undefined) return roundToStep(min + Math.floor((max - min) / 2 / step) * step, step)
  return clampToRange(0, settings)
}

// What's wrong with a value, if anything.
export function problemWith(value: number, settings: NumberSettings): string | undefined {
  const { min, max, step } = settings
  if (Number.isNaN(value)) return 'Enter a number.'
  if (min !== undefined && value < min) return `At least ${min}.`
  if (max !== undefined && value > max) return `At most ${max}.`
  if (roundToStep(value, step) !== value) return step === 1 ? 'Whole numbers only.' : `Use steps of ${step}.`
  return undefined
}

// A number as the grid shows it: at most 4 characters, so it fits a day cell ("8", "3.5", "120", "1.2k").
export function shortNumber(value: number) {
  const text = String(value)
  if (text.length <= 4) return text
  for (const [size, suffix] of [
    [1e9, 'b'],
    [1e6, 'm'],
    [1e3, 'k'],
  ] as const) {
    if (Math.abs(value) >= size) {
      const scaled = value / size
      return `${Math.abs(scaled) < 10 ? Number(scaled.toFixed(1)) : Math.round(scaled)}${suffix}`
    }
  }
  return String(Number(value.toFixed(1)))
}
