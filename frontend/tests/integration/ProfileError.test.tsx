import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { stubApi } from '../helpers/fakeApi'

// Carried over from change 02's live check: a failed profile setup must not go unnoticed.

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

beforeEach(() => {
  fakeAuth.reset(aSession())
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('the home page says so when setting up the profile fails', async () => {
  stubApi({ failProfile: true })
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your profile. Try refreshing the page.")
})

test('no error when the profile is set up fine', async () => {
  stubApi()
  render(<App />)

  await screen.findByRole('button', { name: 'Sign out' })
  expect(screen.queryByText(/couldn't load your profile/i)).not.toBeInTheDocument()
})
