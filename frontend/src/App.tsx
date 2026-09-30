import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '@/auth/AuthProvider'
import { useAuth } from '@/auth/context'
import { ApiStatus } from '@/components/ApiStatus'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { HomePage } from '@/pages/HomePage'
import { NewGoalPage } from '@/pages/NewGoalPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignInPage } from '@/pages/SignInPage'

// Signed in: the app. Signed out: the front door.
function Guarded() {
  const { session, loading } = useAuth()
  if (loading) return <p>Loading…</p>
  if (!session) return <SignInPage />
  return (
    <Routes>
      <Route path="/goals" element={<GoalsPage session={session} />} />
      <Route path="/goals/new" element={<NewGoalPage session={session} />} />
      <Route path="/settings" element={<SettingsPage session={session} />} />
      <Route path="*" element={<HomePage session={session} />} />
    </Routes>
  )
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
