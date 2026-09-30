import { describe, expect, test } from 'vitest'
import { checkRange, emojiFaces, suggestStyle } from '@/goals/rangeRules'

describe('suggestStyle', () => {
  test.each([
    [1, 5, 'buttons'],
    [1, 11, 'buttons'],
    [0, 10, 'buttons'],
    [1, 12, 'slider'],
    [-50, 50, 'slider'],
  ])('%i to %i suggests %s', (min, max, style) => {
    expect(suggestStyle(min, max)).toBe(style)
  })
})

describe('checkRange', () => {
  test('a valid range gives its numbers and no errors', () => {
    expect(checkRange('-5', '5')).toEqual({ min: -5, max: 5, errors: {} })
  })

  test('both ends are required', () => {
    expect(checkRange('', '').errors).toEqual({
      'range.min': ['Minimum is required.'],
      'range.max': ['Maximum is required.'],
    })
  })

  test('both ends must be whole numbers', () => {
    expect(checkRange('0.5', '7.5').errors).toEqual({
      'range.min': ['Minimum must be a whole number.'],
      'range.max': ['Maximum must be a whole number.'],
    })
  })

  test.each([
    ['10', '10'],
    ['10', '1'],
  ])('%s to %s is rejected because the minimum is not below the maximum', (min, max) => {
    expect(checkRange(min, max).errors).toEqual({ range: ['Minimum must be less than maximum.'] })
  })
})

describe('emojiFaces', () => {
  test('five values get one face each, worst to best', () => {
    expect(emojiFaces(5)).toEqual(['😫', '🙁', '😐', '🙂', '🤩'])
  })

  test('fewer values skip faces evenly but keep both ends', () => {
    expect(emojiFaces(3)).toEqual(['😫', '😐', '🤩'])
    expect(emojiFaces(2)).toEqual(['😫', '🤩'])
  })

  test('more values repeat faces, still worst to best', () => {
    const faces = emojiFaces(9)
    expect(faces).toHaveLength(9)
    expect(faces[0]).toBe('😫')
    expect(faces[8]).toBe('🤩')
    expect(faces[4]).toBe('😐')
  })
})
