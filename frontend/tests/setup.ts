import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Remove anything rendered by one test before the next test starts.
afterEach(() => {
  cleanup()
})
