import type { FieldErrors } from '@/api/client'

const minOptions = 2
const maxLabelLength = 40

// Problems with a pick-one goal's option labels, keyed like the server's errors.
export function checkOptions(labels: string[]): FieldErrors {
  const errors: FieldErrors = {}
  const trimmed = labels.map((label) => label.trim())

  trimmed.forEach((label, i) => {
    if (label === '') errors[`enum.options[${i}].label`] = ['Each option needs a label.']
    else if (label.length > maxLabelLength)
      errors[`enum.options[${i}].label`] = [`Labels must be at most ${maxLabelLength} characters.`]
  })

  const filled = trimmed.filter((label) => label !== '')
  if (labels.length < minOptions) errors['enum.options'] = [`At least ${minOptions} options are required.`]
  else if (new Set(filled).size < filled.length) errors['enum.options'] = ['Option labels must be unique.']

  return errors
}

// A copy of the list with one item moved from one position to another.
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}
