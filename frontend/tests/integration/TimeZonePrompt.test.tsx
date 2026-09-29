import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi } from '../helpers/fakeApi'

// Spec: user-profile / "Time zone mismatch prompt"

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
// A profile zone guaranteed to differ from whatever zone the test machine is in.
const otherTimeZone = browserTimeZone === 'Asia/Kolkata' ? 'America/New_York' : 'Asia/Kolkata'

beforeEach(() => {
  fakeAuth.reset(aSession())
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('no prompt when the browser and profile time zones match', async () => {
  stubApi({ profile: { timeZone: browserTimeZone, weekStart: 'sunday' } })
  render(<App />)

  await screen.findByRole('button', { name: 'Sign out' })
  await waitFor(() => expect(screen.queryByText(/your browser says/i)).not.toBeInTheDocument())
})

test('a different browser time zone shows a prompt, and accepting updates the profile', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi({ profile: { timeZone: otherTimeZone, weekStart: 'sunday' } })
  render(<App />)

  expect(await screen.findByText(/your browser says/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: `Use ${browserTimeZone}` }))

  await waitFor(() => expect(callsTo(fetchMock, '/api/me', 'PATCH')).toHaveLength(1))
  const [, init] = callsTo(fetchMock, '/api/me', 'PATCH')[0]
  expect(JSON.parse(String(init?.body))).toEqual({ timeZone: browserTimeZone })
  await waitFor(() => expect(screen.queryByText(/your browser says/i)).not.toBeInTheDocument())
})

test('keeping the profile time zone dismisses the prompt without changing anything', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi({ profile: { timeZone: otherTimeZone, weekStart: 'sunday' } })
  render(<App />)

  await user.click(await screen.findByRole('button', { name: `Keep ${otherTimeZone}` }))

  expect(screen.queryByText(/your browser says/i)).not.toBeInTheDocument()
  expect(callsTo(fetchMock, '/api/me', 'PATCH')).toHaveLength(0)
})
