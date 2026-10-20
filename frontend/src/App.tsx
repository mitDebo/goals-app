import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '@/auth/AuthProvider'
import { useAuth } from '@/auth/context'
import { ApiStatus } from '@/components/ApiStatus'
import { Header } from '@/components/Header'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { CurrentRunsPage } from '@/pages/CurrentRunsPage'
import { EditGoalPage } from '@/pages/EditGoalPage'
import { EditPlanPage } from '@/pages/EditPlanPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { HomePage } from '@/pages/HomePage'
import { LoggedOutPage } from '@/pages/LoggedOutPage'
import { NewGoalPage } from '@/pages/NewGoalPage'
import { NewPlanPage } from '@/pages/NewPlanPage'
import { PastRunsPage } from '@/pages/PastRunsPage'
import { PlansPage } from '@/pages/PlansPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignInPage } from '@/pages/SignInPage'
import { StartRunPage } from '@/pages/StartRunPage'

// Signed in: the app. Signed out: the placeholder front page, whatever the address.
function Guarded() {
  const { session, loading } = useAuth()
  if (loading) return <p>Loading…</p>
  if (!session) return <LoggedOutPage />
  return (
    <Routes>
      <Route path="/runs" element={<CurrentRunsPage session={session} />} />
      <Route path="/runs/past" element={<PastRunsPage session={session} />} />
      <Route path="/goals" element={<GoalsPage session={session} />} />
      <Route path="/goals/new" element={<NewGoalPage session={session} />} />
      <Route path="/goals/:id/edit" element={<EditGoalPage session={session} />} />
      <Route path="/plans" element={<PlansPage session={session} />} />
      <Route path="/plans/new" element={<NewPlanPage session={session} />} />
      <Route path="/plans/:id/edit" element={<EditPlanPage session={session} />} />
      <Route path="/plans/:id/start" element={<StartRunPage session={session} />} />
      <Route path="/settings" element={<SettingsPage session={session} />} />
      <Route path="*" element={<HomePage session={session} />} />
    </Routes>
  )
}

// The sign-in options. Already signed in? Straight home.
function SignInRoute() {
  const { session, loading } = useAuth()
  if (loading) return <p>Loading…</p>
  return session ? <Navigate to="/" replace /> : <SignInPage />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="p-6 text-lg">
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/sign-in" element={<SignInRoute />} />
            <Route path="*" element={<Guarded />} />
          </Routes>
          <ApiStatus />
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
