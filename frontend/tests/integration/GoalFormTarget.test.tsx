import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi } from '../helpers/fakeApi'

// Spec: goals / "Optional per-day target"; change 03 task 4.4.

// Parked for the prototype: new goals are yes/no only (spec/prototype.md). Re-enable with the other kinds.

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

beforeEach(() => {
  fakeAuth.reset(aSession())
  window.history.replaceState({}, '', '/goals/new')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function newGoal(name: string, kind: string) {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)
  await user.type(await screen.findByLabelText('Name'), name)
  await user.click(screen.getByRole('radio', { name: kind }))
  return { user, fetchMock }
}

const sentGoal = (fetchMock: ReturnType<typeof stubApi>) =>
  JSON.parse(String(callsTo(fetchMock, '/api/goals', 'POST')[0][1]?.body))

async function saveAndReturn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Save' }))
  await screen.findByRole('heading', { name: 'Your goals' })
}

test.skip('yes/no goals have no target settings', async () => {
  await newGoal('Read', 'Yes / no')

  expect(screen.queryByRole('checkbox', { name: 'Set a daily target' })).not.toBeInTheDocument()
})

test.skip('a target is off until you turn it on', async () => {
  const { user, fetchMock } = await newGoal('Running', 'Number')

  expect(screen.getByRole('checkbox', { name: 'Set a daily target' })).not.toBeChecked()
  expect(screen.queryByLabelText('Target value')).not.toBeInTheDocument()

  await saveAndReturn(user)
  expect(sentGoal(fetchMock)).not.toHaveProperty('target')
})

test.skip('a number goal takes "at most" a decimal value', async () => {
  const { user, fetchMock } = await newGoal('Drinks', 'Number')

  await user.click(screen.getByRole('checkbox', { name: 'Set a daily target' }))
  await user.selectOptions(screen.getByLabelText('Comparison'), 'At most')
  await user.type(screen.getByLabelText('Target value'), '2.5')
  await saveAndReturn(user)

  expect(sentGoal(fetchMock).target).toEqual({ comparison: 'at_most', value: 2.5 })
})

test.skip('a range goal takes "at least" a value inside the range', async () => {
  const { user, fetchMock } = await newGoal('Focus', 'Range')
  await user.type(screen.getByLabelText('Minimum'), '1')
  await user.type(screen.getByLabelText('Maximum'), '10')

  await user.click(screen.getByRole('checkbox', { name: 'Set a daily target' }))
  expect(screen.getByLabelText('Comparison')).toHaveValue('at_least')
  await user.type(screen.getByLabelText('Target value'), '7')
  await saveAndReturn(user)

  expect(sentGoal(fetchMock).target).toEqual({ comparison: 'at_least', value: 7 })
})

test.skip.each([
  ['12', 'Target must be between 1 and 10.'],
  ['7.5', 'A range target must be a whole number.'],
  ['', 'A target value is required.'],
])('a range target of "%s" is caught before anything is sent', async (value, message) => {
  const { user, fetchMock } = await newGoal('Focus', 'Range')
  await user.type(screen.getByLabelText('Minimum'), '1')
  await user.type(screen.getByLabelText('Maximum'), '10')
  await user.click(screen.getByRole('checkbox', { name: 'Set a daily target' }))
  if (value) await user.type(screen.getByLabelText('Target value'), value)

  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(screen.getByLabelText('Target value')).toHaveAccessibleDescription(message)
  expect(callsTo(fetchMock, '/api/goals', 'POST')).toHaveLength(0)
})

test.skip('turning the target back off leaves it out', async () => {
  const { user, fetchMock } = await newGoal('Running', 'Number')
  await user.click(screen.getByRole('checkbox', { name: 'Set a daily target' }))
  await user.type(screen.getByLabelText('Target value'), '3')
  await user.click(screen.getByRole('checkbox', { name: 'Set a daily target' }))
  await saveAndReturn(user)

  expect(sentGoal(fetchMock)).not.toHaveProperty('target')
})

test.skip('a pick-one goal\'s target is the options you mark as good', async () => {
  const { user, fetchMock } = await newGoal('Mood', 'Pick one')
  await user.type(screen.getByLabelText('Option 1'), '😞')
  await user.type(screen.getByLabelText('Option 2'), '😐')
  await user.click(screen.getByRole('button', { name: 'Add option' }))
  await user.type(screen.getByLabelText('Option 3'), '😀')

  expect(screen.queryByRole('checkbox', { name: 'Set a daily target' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('checkbox', { name: 'Option 2 counts as a hit' }))
  await user.click(screen.getByRole('checkbox', { name: 'Option 3 counts as a hit' }))
  await saveAndReturn(user)

  const sent = sentGoal(fetchMock)
  expect(sent.enum.options).toEqual([{ label: '😞' }, { label: '😐', isTarget: true }, { label: '😀', isTarget: true }])
  expect(sent).not.toHaveProperty('target')
})
