import { describe, expect, test } from 'vitest'
import { checkOptions, moveItem } from '@/goals/optionRules'

describe('checkOptions', () => {
  test('two or more distinct labels are fine', () => {
    expect(checkOptions(['😞', '😐', '😀'])).toEqual({})
  })

  test('every option needs a label', () => {
    expect(checkOptions(['😞', ' ', '😀'])).toEqual({ 'enum.options[1].label': ['Each option needs a label.'] })
  })

  test('labels must be unique, ignoring surrounding spaces', () => {
    expect(checkOptions(['😀', '😐', ' 😀 '])).toEqual({ 'enum.options': ['Option labels must be unique.'] })
  })

  test('at least two options are required', () => {
    expect(checkOptions(['😀'])).toEqual({ 'enum.options': ['At least 2 options are required.'] })
  })

  test('a label can be at most 40 characters', () => {
    expect(checkOptions(['a'.repeat(40), 'b'])).toEqual({})
    expect(checkOptions(['a'.repeat(41), 'b'])).toEqual({
      'enum.options[0].label': ['Labels must be at most 40 characters.'],
    })
  })
})

describe('moveItem', () => {
  test('moves an item to a new position, shifting the others', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  test('leaves the original list alone', () => {
    const list = ['a', 'b']
    moveItem(list, 0, 1)
    expect(list).toEqual(['a', 'b'])
  })
})
