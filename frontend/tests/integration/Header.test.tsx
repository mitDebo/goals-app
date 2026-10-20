import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '@/App'
import { aSession, fakeAuth } from '../helpers/fakeAuth'
import { stubApi } from '../helpers/fakeApi'

// The header on every page: site name on the left; your picture (the menu) or "Sign in" on the right.

vi.mock('@/auth/supabase', async () => {
  const { fakeAuth } = await import('../helpers/fakeAuth')
  return { supabase: { auth: fakeAuth.auth } }
})

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  stubApi({ profile: { timeZone: browserTimeZone, weekStart: 'sunday' } })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('signed out: the page says so, and the header offers sign-in', async () => {
  fakeAuth.reset(null)
  const user = userEvent.setup()
  render(<App />)

  expect(await screen.findByText('Logged out')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('link', { name: 'Sign in' }))
  expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
})

test('signed in: the header shows the picture from the sign-in provider', async () => {
  fakeAuth.reset(aSession('token', { avatar_url: 'https://example.com/me.png' }))
  render(<App />)

  expect(await screen.findByText('Logged In')).toBeInTheDocument()
  const menuButton = screen.getByRole('button', { name: 'Account menu' })
  expect(menuButton.querySelector('img')).toHaveAttribute('src', 'https://example.com/me.png')
})

test('signed in by email (no picture): the header shows your first letter instead', async () => {
  fakeAuth.reset(aSession())
  render(<App />)

  expect(await screen.findByRole('button', { name: 'Account menu' })).toHaveTextContent('K')
})

test('the picture opens a menu with the app pages, and Escape closes it', async () => {
  fakeAuth.reset(aSession())
  const user = userEvent.setup()
  render(<App />)

  await user.click(await screen.findByRole('button', { name: 'Account menu' }))
  const menu = screen.getByRole('navigation', { name: 'Account' })
  for (const name of ['Current runs', 'Past runs', 'Plans', 'Goals', 'Settings']) {
    expect(within(menu).getByRole('link', { name })).toBeInTheDocument()
  }

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('navigation', { name: 'Account' })).not.toBeInTheDocument()
})
