import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi, type FakeRun } from '../helpers/fakeApi'

// Prototype: the home page sheet. Easy to get subtly wrong: which boxes are due, bonus or in the
// future, and putting a box back when the server refuses a tick.

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

// Started 3 days ago: days 1–3 have happened, days 4–5 haven't.
const run: FakeRun = {
  id: 'run-1',
  planId: 'plan-1',
  planName: 'Work week',
  startDate: '2026-03-01',
  endDate: '2026-03-05',
  goals: [
    { goalId: 'read', goalName: 'Read', days: [1, 3] },
    { goalId: 'gym', goalName: 'Gym', times: 2 },
  ],
  achievements: [
    { goalId: 'read', date: '2026-03-01' },
    { goalId: 'read', date: '2026-03-02' },
    { goalId: 'gym', date: '2026-03-02' },
  ],
}

const start = (options: Parameters<typeof stubApi>[0] = {}) => {
  const fetchMock = stubApi({
    profile: { timeZone: browserTimeZone, weekStart: 'sunday' },
    runs: [run],
    today: '2026-03-03',
    ...options,
  })
  render(<App />)
  return fetchMock
}

const box = (name: string) => screen.findByRole('button', { name })

beforeEach(() => {
  window.history.replaceState({}, '', '/runs')
  fakeAuth.reset(aSession())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('the sheet shows what is due, done, bonus and still to come', async () => {
  start()

  expect(await box('Read, Mar 1: done')).toBeInTheDocument()
  expect(await box('Read, Mar 2: bonus, done')).toBeInTheDocument()
  expect(await box('Read, Mar 3: due, not done')).toBeInTheDocument()
  expect(await box('Read, Mar 4: hasn\'t happened yet')).toBeDisabled()
  expect(await box('Gym, Mar 1: not done')).toBeEnabled()
  expect(screen.getByText('1 of 2')).toBeInTheDocument()
})

test('ticking a box saves it and fills it in', async () => {
  const fetchMock = start()

  await userEvent.click(await box('Read, Mar 3: due, not done'))

  expect(await box('Read, Mar 3: done')).toHaveAttribute('aria-pressed', 'true')
  expect(callsTo(fetchMock, '/api/runs/run-1/achievements/read/2026-03-03', 'PUT')).toHaveLength(1)
})

test('if the server refuses a tick, the box goes back and says so', async () => {
  start({ failTicks: true })

  await userEvent.click(await box('Gym, Mar 2: done'))

  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save that tick.")
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gym, Mar 2: done' })).toBeInTheDocument())
})

test('deleting a run asks first, then removes its sheet', async () => {
  const fetchMock = start()

  await userEvent.click(await screen.findByRole('button', { name: 'Delete run' }))
  expect(callsTo(fetchMock, '/api/runs/run-1', 'DELETE')).toHaveLength(0)
  await userEvent.click(screen.getByRole('button', { name: 'Yes, delete it' }))

  expect(await screen.findByText(/Nothing running right now/)).toBeInTheDocument()
  expect(callsTo(fetchMock, '/api/runs/run-1', 'DELETE')).toHaveLength(1)
})

test('ending a run early moves it to past runs', async () => {
  start()

  await userEvent.click(await screen.findByRole('button', { name: 'Change end date' }))
  const input = screen.getByLabelText('New end date')
  await userEvent.clear(input)
  await userEvent.type(input, '2026-03-02')
  await userEvent.click(screen.getByRole('button', { name: 'Save end date' }))

  expect(await screen.findByText(/Nothing running right now/)).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
  await userEvent.click(screen.getByRole('link', { name: 'Past runs' }))
  expect(await screen.findByRole('region', { name: 'Work week' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Mar 3/ })).not.toBeInTheDocument()
})
