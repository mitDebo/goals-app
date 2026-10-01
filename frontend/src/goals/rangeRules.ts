import type { FieldErrors } from '@/api/client'

export type RangeStyle = 'buttons' | 'slider' | 'dial' | 'stepper' | 'emoji_scale'

export const rangeStyles: { value: RangeStyle; label: string }[] = [
  { value: 'buttons', label: 'Buttons' },
  { value: 'slider', label: 'Slider' },
  { value: 'dial', label: 'Dial' },
  { value: 'stepper', label: 'Stepper' },
  { value: 'emoji_scale', label: 'Emoji scale' },
]

// Mirrors the server: at most 11 values → buttons, otherwise a slider.
export const suggestStyle = (min: number, max: number): RangeStyle =>
  max - min + 1 <= 11 ? 'buttons' : 'slider'

// The range as numbers, plus any problems keyed like the server's errors.
export function checkRange(minText: string, maxText: string): { min?: number; max?: number; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const min = wholeNumber(minText, 'range.min', 'Minimum', errors)
  const max = wholeNumber(maxText, 'range.max', 'Maximum', errors)
  if (min !== undefined && max !== undefined && min >= max) errors.range = ['Minimum must be less than maximum.']
  return { min, max, errors }
}

function wholeNumber(text: string, field: string, label: string, errors: FieldErrors): number | undefined {
  if (text.trim() === '') {
    errors[field] = [`${label} is required.`]
    return undefined
  }
  const number = Number(text)
  if (!Number.isInteger(number)) {
    errors[field] = [`${label} must be a whole number.`]
    return undefined
  }
  return number
}

const faces = ['😫', '🙁', '😐', '🙂', '🤩']

// One face per value, spread from worst (😫) to best (🤩).
export const emojiFaces = (count: number): string[] =>
  count === 1
    ? [faces[2]]
    : Array.from({ length: count }, (_, i) => faces[Math.round((i * (faces.length - 1)) / (count - 1))])
