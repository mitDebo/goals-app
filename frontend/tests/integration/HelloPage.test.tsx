import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { fakeAuth } from '../helpers/fakeAuth'

// Spec: platform-skeleton / "SPA displays the hello message"
// On load, the page asks the backend (/api/hello) and shows what it says.

// The status line shows on every page, so these tests use a signed-out visitor.
vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

beforeEach(() => {
  fakeAuth.reset(null)
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('shows the Goals heading and tagline', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('hello, goals', { status: 200 })))

  render(<App />)

  expect(screen.getByRole('heading', { level: 1, name: 'Goals' })).toBeInTheDocument()
  expect(screen.getByText('Your week, one box at a time.')).toBeInTheDocument()
  // Let the pending request finish so it doesn't leak into the next test.
  expect(await screen.findByText('hello, goals')).toBeInTheDocument()
})

test('shows the message returned by /api/hello', async () => {
  // Pretend backend: any request answers "hello, goals".
  const fetchMock = vi.fn(async () => new Response('hello, goals', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  render(<App />)

  // findByText keeps looking for a short while, because the answer arrives a moment later.
  expect(await screen.findByText('hello, goals')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith('/api/hello')
})

// Spec: platform-skeleton / "Backend unavailable"
// If asking the backend goes wrong, the page shows an error instead of the message.

test('shows an error when /api/hello answers with a server error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })))

  render(<App />)

  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByText('boom')).not.toBeInTheDocument()
})

test('shows an error when the backend cannot be reached at all', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))

  render(<App />)

  expect(await screen.findByRole('alert')).toBeInTheDocument()
})
