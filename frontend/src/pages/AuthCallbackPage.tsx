import { Navigate } from 'react-router'
import { useAuth } from '@/auth/context'

// Where sign-in providers send people back. Supabase finishes signing in from
// the address bar; as soon as we have a session, go into the app.
export function AuthCallbackPage() {
  const { session } = useAuth()
  if (session) return <Navigate to="/" replace />
  return <p>Signing you in…</p>
}
