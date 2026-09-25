import { expect, test } from 'vitest'

// Task 7.3: a deliberately failing test to prove CI blocks the merge.
// This PR must be CLOSED, never merged.
test('deliberately fails', () => {
  expect(1 + 1).toBe(3)
})
