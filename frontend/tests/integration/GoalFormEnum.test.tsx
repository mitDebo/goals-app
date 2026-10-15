import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi } from '../helpers/fakeApi'

// Spec: goals / "Enum settings"; change 03 task 4.3.

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

// Opens the form on a pick-one goal named Mood with these option labels typed in.
async function pickOneForm(...labels: string[]) {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)
  await user.type(await screen.findByLabelText('Name'), 'Mood')
  await user.click(screen.getByRole('radio', { name: 'Pick one' }))
  for (let i = 0; i < labels.length; i++) {
    if (i >= 2) await user.click(screen.getByRole('button', { name: 'Add option' }))
    if (labels[i]) await user.type(screen.getByLabelText(`Option ${i + 1}`), labels[i])
  }
  return { user, fetchMock }
}

const sentGoal = (fetchMock: ReturnType<typeof stubApi>) =>
  JSON.parse(String(callsTo(fetchMock, '/api/goals', 'POST')[0][1]?.body))

const optionLabels = () =>
  [1, 2, 3, 4, 5]
    .map((n) => screen.queryByLabelText(`Option ${n}`) as HTMLInputElement | null)
    .filter((input) => input !== null)
    .map((input) => input.value)

async function saveAndReturn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Save' }))
  await screen.findByRole('heading', { name: 'Your goals' })
}

test.skip('each option can have a note', async () => {
  const { user, fetchMock } = await pickOneForm('😞', '😀')

  await user.type(screen.getByLabelText('Note for option 1 (optional)'), 'bad day')
  await saveAndReturn(user)

  expect(sentGoal(fetchMock).enum.options).toEqual([{ label: '😞', note: 'bad day' }, { label: '😀' }])
})

test.skip('options can be marked as ranked from worst to best', async () => {
  const { user, fetchMock } = await pickOneForm('😞', '😐', '😀')

  await user.click(screen.getByRole('checkbox', { name: 'Ranked (first is worst, last is best)' }))
  await saveAndReturn(user)

  expect(sentGoal(fetchMock).enum.ordered).toBe(true)
})

test.skip('options move up and down with buttons, taking their notes with them', async () => {
  const { user, fetchMock } = await pickOneForm('😐', '😞', '😀')
  await user.type(screen.getByLabelText('Note for option 2 (optional)'), 'bad day')

  await user.click(screen.getByRole('button', { name: 'Move option 2 up' }))
  expect(optionLabels()).toEqual(['😞', '😐', '😀'])

  await user.click(screen.getByRole('button', { name: 'Move option 1 down' }))
  await user.click(screen.getByRole('button', { name: 'Move option 2 down' }))
  expect(optionLabels()).toEqual(['😐', '😀', '😞'])

  await saveAndReturn(user)
  expect(sentGoal(fetchMock).enum.options).toEqual([{ label: '😐' }, { label: '😀' }, { label: '😞', note: 'bad day' }])
})

test.skip('the first option cannot move up and the last cannot move down', async () => {
  await pickOneForm('a', 'b', 'c')

  expect(screen.getByRole('button', { name: 'Move option 1 up' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Move option 3 down' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Move option 2 up' })).toBeEnabled()
})

test.skip('each option has a handle for dragging it into place', async () => {
  await pickOneForm('a', 'b', 'c')

  for (const n of [1, 2, 3]) {
    expect(screen.getByRole('button', { name: `Drag option ${n}` })).toBeInTheDocument()
  }
})

test.skip('there are always at least two options', async () => {
  await pickOneForm('a', 'b')

  expect(screen.queryByRole('button', { name: /Remove option/ })).not.toBeInTheDocument()
})

test.skip('an option without a label is caught before anything is sent', async () => {
  const { user, fetchMock } = await pickOneForm('😞', '', '😀')

  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(screen.getByLabelText('Option 2')).toHaveAccessibleDescription('Each option needs a label.')
  expect(callsTo(fetchMock, '/api/goals', 'POST')).toHaveLength(0)
})

test.skip('two options with the same label are caught before anything is sent', async () => {
  const { user, fetchMock } = await pickOneForm('😀', '😐', ' 😀 ')

  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByText('Option labels must be unique.')).toBeInTheDocument()
  expect(callsTo(fetchMock, '/api/goals', 'POST')).toHaveLength(0)
})
