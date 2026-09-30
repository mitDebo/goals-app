import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, type FakeGoal, stubApi } from '../helpers/fakeApi'

// Spec: goals / "Goal order" (the list side); change 03 task 3.1.

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const read: FakeGoal = { id: 'g1', name: 'Read', type: 'boolean', displayStyle: 'toggle', position: 0 }
const focus: FakeGoal = {
  id: 'g2', name: 'Focus', type: 'range', displayStyle: 'buttons', position: 1, range: { min: 1, max: 10 },
}
const running: FakeGoal = {
  id: 'g3', name: 'Running', type: 'number', displayStyle: 'input', position: 2, number: { unit: 'miles' },
}
const mood: FakeGoal = {
  id: 'g4', name: 'Mood', type: 'enum', displayStyle: 'options', position: 3,
  enum: {
    ordered: true,
    options: [
      { id: 'o1', label: '😞', isTarget: false },
      { id: 'o2', label: '😐', isTarget: true },
      { id: 'o3', label: '😀', isTarget: true },
    ],
  },
}

beforeEach(() => {
  fakeAuth.reset(aSession())
  window.history.replaceState({}, '', '/goals')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('the home page links to your goals', async () => {
  const user = userEvent.setup()
  stubApi({ goals: [read] })
  window.history.replaceState({}, '', '/')
  render(<App />)

  await user.click(await screen.findByRole('link', { name: 'Goals' }))

  expect(window.location.pathname).toBe('/goals')
  expect(await screen.findByRole('heading', { name: 'Your goals' })).toBeInTheDocument()
})

test('goals are listed in the order the server gives them', async () => {
  stubApi({ goals: [mood, read, running, focus] })
  render(<App />)

  const list = await screen.findByRole('list', { name: 'Your goals' })
  const names = within(list).getAllByRole('listitem').map((item) => within(item).getByRole('heading').textContent)
  expect(names).toEqual(['Mood', 'Read', 'Running', 'Focus'])
})

test('each goal says what kind of answer it takes', async () => {
  stubApi({ goals: [read, focus, running, mood] })
  render(<App />)

  const list = await screen.findByRole('list', { name: 'Your goals' })
  const [readItem, focusItem, runningItem, moodItem] = within(list).getAllByRole('listitem')
  expect(readItem).toHaveTextContent('Yes / no')
  expect(focusItem).toHaveTextContent('1 to 10')
  expect(runningItem).toHaveTextContent('Number (miles)')
  expect(moodItem).toHaveTextContent('😞 😐 😀')
})

test('with no goals yet, the page says so', async () => {
  const fetchMock = stubApi({ goals: [] })
  render(<App />)

  expect(await screen.findByText('No goals yet.')).toBeInTheDocument()
  expect(screen.queryByRole('list', { name: 'Your goals' })).not.toBeInTheDocument()
  expect(callsTo(fetchMock, '/api/goals', 'GET')).toHaveLength(1)
})

test('a failure to load goals is shown', async () => {
  stubApi({ failGoals: true })
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load your goals.")
})
