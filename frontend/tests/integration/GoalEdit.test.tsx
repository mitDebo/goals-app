import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, type FakeGoal, stubApi } from '../helpers/fakeApi'

// Spec: goals / "Edit a goal".

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const read: FakeGoal = { id: 'g1', name: 'Read', type: 'boolean', displayStyle: 'toggle', position: 0 }
const focus: FakeGoal = {
  id: 'g2',
  name: 'Focus',
  description: 'How focused was I?',
  type: 'range',
  displayStyle: 'dial',
  position: 1,
  range: { min: 1, max: 10, minLabel: 'scattered', maxLabel: 'laser' },
  target: { comparison: 'at_least', value: 7 },
}
const mood: FakeGoal = {
  id: 'g3',
  name: 'Mood',
  type: 'enum',
  displayStyle: 'options',
  position: 2,
  enum: {
    ordered: true,
    options: [
      { id: 'o1', label: '😞', note: 'bad', isTarget: false },
      { id: 'o2', label: '😐', isTarget: true },
      { id: 'o3', label: '😀', isTarget: true },
    ],
  },
}

beforeEach(() => {
  fakeAuth.reset(aSession())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const sentUpdate = (fetchMock: ReturnType<typeof stubApi>, id: string) => {
  const puts = callsTo(fetchMock, `/api/goals/${id}`, 'PUT')
  expect(puts).toHaveLength(1)
  return JSON.parse(String(puts[0][1]?.body))
}

test('each goal in the list has an Edit link', async () => {
  const user = userEvent.setup()
  stubApi({ goals: [read, focus] })
  window.history.replaceState({}, '', '/goals')
  render(<App />)

  const list = await screen.findByRole('list', { name: 'Your goals' })
  await user.click(within(list).getByRole('link', { name: 'Edit Focus' }))

  expect(window.location.pathname).toBe('/goals/g2/edit')
  expect(await screen.findByRole('heading', { name: 'Edit goal' })).toBeInTheDocument()
})

test('the edit form starts with everything the range goal has', async () => {
  stubApi({ goals: [focus] })
  window.history.replaceState({}, '', '/goals/g2/edit')
  render(<App />)

  expect(await screen.findByLabelText('Name')).toHaveValue('Focus')
  expect(screen.getByLabelText('Description (optional)')).toHaveValue('How focused was I?')
  expect(screen.getByRole('radio', { name: 'Range' })).toBeChecked()
  expect(screen.getByLabelText('Minimum')).toHaveValue(1)
  expect(screen.getByLabelText('Maximum')).toHaveValue(10)
  expect(screen.getByLabelText('Label for the low end (optional)')).toHaveValue('scattered')
  expect(screen.getByLabelText('Label for the high end (optional)')).toHaveValue('laser')
  expect(screen.getByRole('radio', { name: 'Dial' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Set a daily target' })).toBeChecked()
  expect(screen.getByLabelText('Comparison')).toHaveValue('at_least')
  expect(screen.getByLabelText('Target value')).toHaveValue(7)
})

test('the edit form starts with the pick-one goal\'s options, notes, ranking and good options', async () => {
  stubApi({ goals: [mood] })
  window.history.replaceState({}, '', '/goals/g3/edit')
  render(<App />)

  expect(await screen.findByLabelText('Option 1')).toHaveValue('😞')
  expect(screen.getByLabelText('Option 2')).toHaveValue('😐')
  expect(screen.getByLabelText('Option 3')).toHaveValue('😀')
  expect(screen.getByLabelText('Note for option 1 (optional)')).toHaveValue('bad')
  expect(screen.getByRole('checkbox', { name: 'Ranked (first is worst, last is best)' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Option 1 counts as a hit' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Option 2 counts as a hit' })).toBeChecked()
})

test('saving an edited range goal replaces it and returns to your goals', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi({ goals: [focus] })
  window.history.replaceState({}, '', '/goals/g2/edit')
  render(<App />)

  const name = await screen.findByLabelText('Name')
  await user.clear(name)
  await user.type(name, 'Deep focus')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('heading', { name: 'Deep focus' })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/goals')
  expect(sentUpdate(fetchMock, 'g2')).toEqual({
    name: 'Deep focus',
    description: 'How focused was I?',
    type: 'range',
    displayStyle: 'dial',
    range: { min: 1, max: 10, minLabel: 'scattered', maxLabel: 'laser' },
    target: { comparison: 'at_least', value: 7 },
  })
  expect(callsTo(fetchMock, '/api/goals', 'POST')).toHaveLength(0)
})

test('saving an edited pick-one goal keeps option ids so the server knows which is which', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi({ goals: [mood] })
  window.history.replaceState({}, '', '/goals/g3/edit')
  render(<App />)

  await user.click(await screen.findByRole('button', { name: 'Move option 3 up' }))
  await user.click(screen.getByRole('button', { name: 'Add option' }))
  await user.type(screen.getByLabelText('Option 4'), '🤩')
  await user.click(screen.getByRole('button', { name: 'Remove option 1' }))
  await user.click(screen.getByRole('button', { name: 'Save' }))
  await screen.findByRole('heading', { name: 'Your goals' })

  expect(sentUpdate(fetchMock, 'g3').enum).toEqual({
    ordered: true,
    options: [
      { id: 'o3', label: '😀', isTarget: true },
      { id: 'o2', label: '😐', isTarget: true },
      { label: '🤩' },
    ],
  })
})

test('a rejected edit shows the problem next to the field', async () => {
  const user = userEvent.setup()
  stubApi({ goals: [read], rejectGoalWith: { field: 'name', message: 'Name must be at most 100 characters.' } })
  window.history.replaceState({}, '', '/goals/g1/edit')
  render(<App />)

  await user.click(await screen.findByRole('button', { name: 'Save' }))

  expect(await screen.findByText('Name must be at most 100 characters.')).toBeInTheDocument()
  expect(window.location.pathname).toBe('/goals/g1/edit')
})

test('a goal that does not exist (or is not yours) says so', async () => {
  stubApi({ goals: [] })
  window.history.replaceState({}, '', '/goals/nope/edit')
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load this goal.")
})
