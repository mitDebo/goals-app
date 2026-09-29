import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { fakeAuth } from '../helpers/fakeAuth'
import { stubApi } from '../helpers/fakeApi'

// Spec: user-profile / "Passwordless sign-in" (signed-out visitor)

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const callbackUrl = `${window.location.origin}/auth/callback`

beforeEach(() => {
  fakeAuth.reset(null)
  window.history.replaceState({}, '', '/')
  stubApi()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('a signed-out visitor sees the four sign-in options and no password field', async () => {
  render(<App />)

  expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue with Discord' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue with Twitch' })).toBeInTheDocument()
  expect(screen.getByLabelText('Email')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Email me a sign-in link' })).toBeInTheDocument()

  expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  expect(document.querySelector('input[type="password"]')).toBeNull()
})

test.each([
  ['Google', 'google'],
  ['Discord', 'discord'],
  ['Twitch', 'twitch'],
])('"Continue with %s" starts that sign-in and returns to the callback page', async (label, provider) => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(await screen.findByRole('button', { name: `Continue with ${label}` }))

  expect(fakeAuth.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider,
    options: { redirectTo: callbackUrl },
  })
})

test('asking for a magic link emails it and says to check your email', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.type(await screen.findByLabelText('Email'), 'kdubs@example.com')
  await user.click(screen.getByRole('button', { name: 'Email me a sign-in link' }))

  expect(fakeAuth.auth.signInWithOtp).toHaveBeenCalledWith({
    email: 'kdubs@example.com',
    options: { emailRedirectTo: callbackUrl },
  })
  expect(await screen.findByText('Check your email for a sign-in link.')).toBeInTheDocument()
})
