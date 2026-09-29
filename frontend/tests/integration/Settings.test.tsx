import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi } from '../helpers/fakeApi'

// Spec: user-profile / "Edit settings"

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

beforeEach(() => {
  fakeAuth.reset(aSession())
  window.history.replaceState({}, '', '/settings')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('the home page links to settings', async () => {
  const user = userEvent.setup()
  stubApi({ profile: { timeZone: browserTimeZone, weekStart: 'sunday' } })
  window.history.replaceState({}, '', '/')
  render(<App />)

  await user.click(await screen.findByRole('link', { name: 'Settings' }))

  expect(window.location.pathname).toBe('/settings')
  expect(await screen.findByLabelText('Time zone')).toBeInTheDocument()
})

test('settings show the current time zone and week start', async () => {
  stubApi({ profile: { timeZone: 'America/Chicago', weekStart: 'monday' } })
  render(<App />)

  await waitFor(() => expect(screen.getByLabelText('Time zone')).toHaveValue('America/Chicago'))
  expect(screen.getByLabelText('Week starts on')).toHaveValue('monday')
})

test('saving sends the chosen settings and confirms', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi({ profile: { timeZone: 'America/Chicago', weekStart: 'monday' } })
  render(<App />)
  await waitFor(() => expect(screen.getByLabelText('Time zone')).toHaveValue('America/Chicago'))

  await user.selectOptions(screen.getByLabelText('Time zone'), 'Europe/London')
  await user.selectOptions(screen.getByLabelText('Week starts on'), 'sunday')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByText('Settings saved.')).toBeInTheDocument()
  const [, init] = callsTo(fetchMock, '/api/me', 'PATCH')[0]
  expect(JSON.parse(String(init?.body))).toEqual({ timeZone: 'Europe/London', weekStart: 'sunday' })
})

test('a rejected save shows why', async () => {
  const user = userEvent.setup()
  stubApi({
    profile: { timeZone: 'America/Chicago', weekStart: 'monday' },
    rejectPatchWith: { field: 'timeZone', message: 'Time zone must be a valid IANA time zone.' },
  })
  render(<App />)
  await waitFor(() => expect(screen.getByLabelText('Time zone')).toHaveValue('America/Chicago'))

  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Time zone must be a valid IANA time zone.')
  expect(screen.queryByText('Settings saved.')).not.toBeInTheDocument()
})
