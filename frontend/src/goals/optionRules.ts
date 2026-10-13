import type { FieldErrors } from '@/api/client'

// Problems with a pick-one goal's option labels, keyed like the server's errors.
export const checkOptions = (_labels: string[]): FieldErrors => {
  throw new Error('Not implemented')
}

// A copy of the list with one item moved from one position to another.
export const moveItem = <T,>(_list: T[], _from: number, _to: number): T[] => {
  throw new Error('Not implemented')
}
