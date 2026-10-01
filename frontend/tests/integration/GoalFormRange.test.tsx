import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { callsTo, stubApi } from '../helpers/fakeApi'

// Spec: goals / "Range settings" and "Display style"; change 03 task 4.2.

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

// Opens the form on a range goal named Focus with the given ends typed in.
async function rangeForm(min: string, max: string) {
  const user = userEvent.setup()
  const fetchMock = stubApi()
  render(<App />)
  await user.type(await screen.findByLabelText('Name'), 'Focus')
  await user.click(screen.getByRole('radio', { name: 'Range' }))
  if (min) await user.type(screen.getByLabelText('Minimum'), min)
  if (max) await user.type(screen.getByLabelText('Maximum'), max)
  return { user, fetchMock }
}

const sentGoal = (fetchMock: ReturnType<typeof stubApi>) =>
  JSON.parse(String(callsTo(fetchMock, '/api/goals', 'POST')[0][1]?.body))

const preview = () => screen.getByRole('region', { name: 'Preview' })

test('each end of the range can have a label', async () => {
  const { user, fetchMock } = await rangeForm('1', '10')

  await user.type(screen.getByLabelText('Label for the low end (optional)'), 'wasted the day')
  await user.type(screen.getByLabelText('Label for the high end (optional)'), '🤩')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  await screen.findByRole('heading', { name: 'Your goals' })
  expect(sentGoal(fetchMock).range).toEqual({ min: 1, max: 10, minLabel: 'wasted the day', maxLabel: '🤩' })
})

test('the minimum must be below the maximum, checked before anything is sent', async () => {
  const { user, fetchMock } = await rangeForm('10', '10')

  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(await screen.findByText('Minimum must be less than maximum.')).toBeInTheDocument()
  expect(callsTo(fetchMock, '/api/goals', 'POST')).toHaveLength(0)
})

test('both ends must be whole numbers, checked before anything is sent', async () => {
  const { user, fetchMock } = await rangeForm('1', '7.5')

  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(screen.getByLabelText('Maximum')).toHaveAccessibleDescription('Maximum must be a whole number.')
  expect(callsTo(fetchMock, '/api/goals', 'POST')).toHaveLength(0)
})

test('the suggested style follows the range size until you pick one yourself', async () => {
  const { user } = await rangeForm('1', '5')

  expect(screen.getByRole('radio', { name: 'Buttons' })).toBeChecked()

  await user.clear(screen.getByLabelText('Maximum'))
  await user.type(screen.getByLabelText('Maximum'), '50')
  expect(screen.getByRole('radio', { name: 'Slider' })).toBeChecked()

  await user.click(screen.getByRole('radio', { name: 'Dial' }))
  await user.clear(screen.getByLabelText('Maximum'))
  await user.type(screen.getByLabelText('Maximum'), '5')
  expect(screen.getByRole('radio', { name: 'Dial' })).toBeChecked()
})

test('a style you pick yourself is saved with the goal', async () => {
  const picked = await rangeForm('1', '5')
  await picked.user.click(screen.getByRole('radio', { name: 'Emoji scale' }))
  await picked.user.click(screen.getByRole('button', { name: 'Save' }))
  await screen.findByRole('heading', { name: 'Your goals' })

  expect(sentGoal(picked.fetchMock).displayStyle).toBe('emoji_scale')
})

test('there is no preview until the range is valid', async () => {
  await rangeForm('5', '1')

  expect(screen.queryByRole('region', { name: 'Preview' })).not.toBeInTheDocument()
})

test('the preview shows buttons for each value', async () => {
  await rangeForm('1', '5')

  const labels = within(preview()).getAllByRole('button').map((b) => b.textContent)
  expect(labels).toEqual(['1', '2', '3', '4', '5'])
})

test('the preview shows a slider across the range', async () => {
  const { user } = await rangeForm('1', '50')
  await user.click(screen.getByRole('radio', { name: 'Slider' }))

  const slider = within(preview()).getByRole('slider')
  expect(slider).toHaveAttribute('min', '1')
  expect(slider).toHaveAttribute('max', '50')
})

test('the preview shows a dial across the range', async () => {
  const { user } = await rangeForm('-5', '5')
  await user.click(screen.getByRole('radio', { name: 'Dial' }))

  const dial = within(preview()).getByRole('slider', { name: 'Dial' })
  expect(dial).toHaveAttribute('aria-valuemin', '-5')
  expect(dial).toHaveAttribute('aria-valuemax', '5')
})

test('the preview shows a stepper that stays within the range', async () => {
  const { user } = await rangeForm('1', '3')
  await user.click(screen.getByRole('radio', { name: 'Stepper' }))

  const increase = within(preview()).getByRole('button', { name: 'Increase' })
  await user.click(increase)
  await user.click(increase)
  await user.click(increase)

  expect(within(preview()).getByRole('status')).toHaveTextContent('3')
  expect(increase).toBeDisabled()
})

test('the preview shows an emoji scale from worst to best', async () => {
  const { user } = await rangeForm('1', '5')
  await user.click(screen.getByRole('radio', { name: 'Emoji scale' }))

  const faces = within(preview()).getAllByRole('button').map((b) => b.textContent)
  expect(faces).toEqual(['😫', '🙁', '😐', '🙂', '🤩'])
})
