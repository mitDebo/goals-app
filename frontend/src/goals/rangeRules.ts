import type { FieldErrors } from '@/api/client'

export type RangeStyle = 'buttons' | 'slider' | 'dial' | 'stepper' | 'emoji_scale'

// Mirrors the server: at most 11 values → buttons, otherwise a slider.
export const suggestStyle = (_min: number, _max: number): RangeStyle => {
  throw new Error('Not implemented')
}

// The range as numbers, plus any problems keyed like the server's errors.
export const checkRange = (
  _minText: string,
  _maxText: string,
): { min?: number; max?: number; errors: FieldErrors } => {
  throw new Error('Not implemented')
}

// One face per value, spread from worst (😫) to best (🤩).
export const emojiFaces = (_count: number): string[] => {
  throw new Error('Not implemented')
}
