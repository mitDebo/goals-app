import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi } from '../helpers/fakeApi'

// Spec: goals / "Create a goal" and the basic settings of each type; change 03 tasks 4.1 and 4.5.

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

// The JSON body of the (only) goal the form sent to the server.
const sentGoal = (fetchMock: ReturnType<typeof stubApi>) => {
  const posts = callsTo(fetchMock, '/api/goals', 'POST')
  expect(posts).toHaveLength(1)
  return JSON.parse(String(posts[0][1]?.body))
}

const kindFields = ['Minimum', 'Maximum', 'Unit (optional)', 'Option 1']

test('the goals page has a New goal link that opens the form', async () => {
  const user = userEvent.setup()
  stubApi()
  window.history.replaceState({}, '', '/goals')
  render(<App />)

  await user.click(await screen.findByRole('link', { name: 'New goal' }))

  expect(window.location.pathname).toBe('/goals/new')
  expect(await screen.findByRole('heading', { name: 'New goal' })).toBeInTheDocument()
})

test('choosing a kind of goal shows only that kind of goal\'s fields', async () => {
  const user = userEvent.setup()
  stubApi()
  render(<App />)
  const shown = () => kindFields.filter((label) => screen.queryByLabelText(label))

  expect(await screen.findByRole('radio', { name: 'Yes / no' })).toBeChecked()
  expect(shown()).toEqual([])

  await user.click(screen.getByRole('radio', { name: 'Range' }))
  expect(shown()).toEqual(['Minimum', 'Maximum'])

  await user.click(screen.getByRole('radio', { name: 'Number' }))
  expect(shown()).toEqual(['Unit (optional)'])

  await user.click(screen.getByRole('radio', { name: 'Pick one' }))
  expect(shown()).toEqual(['Option 1'])
  expect(screen.getByLabelText('Option 2')).toBeInTheDocument()
})

test('saving a yes/no goal creates it and returns to your goals', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)

  await user.type(await screen.findByLabelText('Name'), 'Read')
  await user.type(screen.getByLabelText('Description (optional)'), '20 pages')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('heading', { name: 'Your goals' })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/goals')
  expect(await screen.findByRole('heading', { name: 'Read' })).toBeInTheDocument()
  expect(sentGoal(fetchMock)).toEqual({ name: 'Read', description: '20 pages', type: 'boolean' })
})

test('a range goal is saved with its two ends', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)

  await user.type(await screen.findByLabelText('Name'), 'Focus')
  await user.click(screen.getByRole('radio', { name: 'Range' }))
  await user.type(screen.getByLabelText('Minimum'), '-5')
  await user.type(screen.getByLabelText('Maximum'), '5')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  await screen.findByRole('heading', { name: 'Your goals' })
  expect(sentGoal(fetchMock)).toEqual({ name: 'Focus', type: 'range', range: { min: -5, max: 5 } })
})

test('a number goal is saved with its unit', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)

  await user.type(await screen.findByLabelText('Name'), 'Running')
  await user.click(screen.getByRole('radio', { name: 'Number' }))
  await user.type(screen.getByLabelText('Unit (optional)'), 'miles')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  await screen.findByRole('heading', { name: 'Your goals' })
  expect(sentGoal(fetchMock)).toEqual({ name: 'Running', type: 'number', number: { unit: 'miles' } })
})

test('a pick-one goal is saved with its options in order, and options can be added and removed', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)

  await user.type(await screen.findByLabelText('Name'), 'Mood')
  await user.click(screen.getByRole('radio', { name: 'Pick one' }))
  await user.type(screen.getByLabelText('Option 1'), '😞')
  await user.type(screen.getByLabelText('Option 2'), '🤔')
  await user.click(screen.getByRole('button', { name: 'Add option' }))
  await user.type(screen.getByLabelText('Option 3'), '😐')
  await user.click(screen.getByRole('button', { name: 'Add option' }))
  await user.type(screen.getByLabelText('Option 4'), '😀')
  await user.click(screen.getByRole('button', { name: 'Remove option 2' }))
  await user.click(screen.getByRole('button', { name: 'Save' }))

  await screen.findByRole('heading', { name: 'Your goals' })
  expect(sentGoal(fetchMock)).toEqual({
    name: 'Mood',
    type: 'enum',
    enum: { ordered: false, options: [{ label: '😞' }, { label: '😐' }, { label: '😀' }] },
  })
})

test.each([
  ['name', 'Name', 'A name is required.'],
  ['range.max', 'Maximum', 'Maximum must be a whole number.'],
  ['enum.options[1].label', 'Option 2', 'Each option needs a label.'],
])('a server error for %s appears next to that field', async (field, label, message) => {
  const user = userEvent.setup()
  stubApi({ rejectGoalWith: { field, message } })
  render(<App />)

  await user.type(await screen.findByLabelText('Name'), 'Something')
  if (field.startsWith('range')) await user.click(screen.getByRole('radio', { name: 'Range' }))
  if (field.startsWith('enum')) await user.click(screen.getByRole('radio', { name: 'Pick one' }))
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByText(message)).toBeInTheDocument()
  expect(screen.getByLabelText(label)).toHaveAccessibleDescription(message)
  expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
})

test('after a rejected save you stay on the form with what you typed', async () => {
  const user = userEvent.setup()
  stubApi({ rejectGoalWith: { field: 'name', message: 'Name must be at most 100 characters.' } })
  render(<App />)

  await user.type(await screen.findByLabelText('Name'), 'Read')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  await screen.findByText('Name must be at most 100 characters.')
  expect(window.location.pathname).toBe('/goals/new')
  expect(screen.getByLabelText('Name')).toHaveValue('Read')
})

test('an error for a field the form does not show still appears', async () => {
  const user = userEvent.setup()
  stubApi({ rejectGoalWith: { field: 'displayStyle', message: "'dial' is not a display style for number goals." } })
  render(<App />)

  await user.type(await screen.findByLabelText('Name'), 'Running')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByRole('alert')).toHaveTextContent("'dial' is not a display style for number goals.")
})

test('Cancel goes back to your goals without saving', async () => {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)

  await user.click(await screen.findByRole('link', { name: 'Cancel' }))

  expect(window.location.pathname).toBe('/goals')
  expect(callsTo(fetchMock, '/api/goals', 'POST')).toHaveLength(0)
})
