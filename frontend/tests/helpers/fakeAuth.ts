import { vi } from 'vitest'

// A pretend Supabase auth client. Tests decide whether someone is signed in,
// and can sign in or out at any moment to see how the app reacts.
export type FakeSession = { access_token: string; user: { id: string; email?: string } }
type Listener = (event: string, session: FakeSession | null) => void

let session: FakeSession | null = null
const listeners = new Set<Listener>()

const notify = (event: string) => listeners.forEach((listener) => listener(event, session))

export const fakeAuth = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    onAuthStateChange: vi.fn((listener: Listener) => {
      listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }
    }),
    signInWithOAuth: vi.fn(async (_args: unknown) => ({ data: {}, error: null })),
    signInWithOtp: vi.fn(async (_args: unknown) => ({ data: {}, error: null })),
    signOut: vi.fn(async () => {
      session = null
      notify('SIGNED_OUT')
      return { error: null }
    }),
  },

  // Start a test as signed in (with a session) or signed out (null).
  reset(initial: FakeSession | null) {
    session = initial
    listeners.clear()
    Object.values(fakeAuth.auth).forEach((fn) => fn.mockClear())
  },

  // Someone just finished signing in (e.g. came back from Google).
  signIn(next: FakeSession) {
    session = next
    notify('SIGNED_IN')
  },
}

export const aSession = (accessToken = 'test-token'): FakeSession => ({
  access_token: accessToken,
  user: { id: '11111111-1111-1111-1111-111111111111', email: 'kdubs@example.com' },
})
