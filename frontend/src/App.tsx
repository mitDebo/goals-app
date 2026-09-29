import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '@/auth/AuthProvider'
import { useAuth } from '@/auth/context'
import { ApiStatus } from '@/components/ApiStatus'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { HomePage } from '@/pages/HomePage'
import { SignInPage } from '@/pages/SignInPage'

// Signed in: the app. Signed out: the front door.
function Guarded() {
  const { session, loading } = useAuth()
  if (loading) return <p>Loading…</p>
  return session ? <HomePage session={session} /> : <SignInPage />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <main className="p-6 text-lg">
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="mb-6 text-muted-foreground">Your week, one box at a time.</p>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<Guarded />} />
          </Routes>
          <ApiStatus />
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
