import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi } from '../helpers/fakeApi'

// Spec: user-profile / "Passwordless sign-in", "Profile created on first sign-in"

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

let fetchMock: ReturnType<typeof stubApi>

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  fetchMock = stubApi()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('coming back from sign-in creates the profile with the browser time zone and opens the app', async () => {
  fakeAuth.reset(null)
  window.history.replaceState({}, '', '/auth/callback')
  render(<App />)

  act(() => fakeAuth.signIn(aSession('fresh-token')))

  await waitFor(() => expect(callsTo(fetchMock, '/api/me')).toHaveLength(1))
  const [, init] = callsTo(fetchMock, '/api/me')[0]
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual({ timeZone: browserTimeZone })

  expect(await screen.findByText('Logged In')).toBeInTheDocument()
  expect(window.location.pathname).toBe('/')
})

test('calls to our API carry the sign-in token', async () => {
  fakeAuth.reset(aSession('my-token'))
  render(<App />)

  await waitFor(() => expect(callsTo(fetchMock, '/api/me')).toHaveLength(1))
  const [, init] = callsTo(fetchMock, '/api/me')[0]
  expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer my-token')
})

test('signing out from the account menu returns to the logged-out page', async () => {
  const user = userEvent.setup()
  fakeAuth.reset(aSession())
  render(<App />)

  await user.click(await screen.findByRole('button', { name: 'Account menu' }))
  await user.click(screen.getByRole('button', { name: 'Sign out' }))

  expect(fakeAuth.auth.signOut).toHaveBeenCalled()
  expect(await screen.findByText('Logged out')).toBeInTheDocument()
})
