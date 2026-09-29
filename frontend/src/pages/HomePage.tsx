import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { supabase } from '@/auth/supabase'
import { browserTimeZone, ensureProfile, updateProfile } from '@/profile/api'

// Inside the app. On arrival, make sure our backend has a profile for this
// person, and offer to fix it if their browser is now in another time zone.
export function HomePage({ session }: { session: Session }) {
  const profileEnsuredFor = useRef<string | null>(null)
  const [savedTimeZone, setSavedTimeZone] = useState<string | null>(null)
  const browserZone = browserTimeZone()

  useEffect(() => {
    if (profileEnsuredFor.current === session.access_token) return
    profileEnsuredFor.current = session.access_token

    ensureProfile(session.access_token).then((profile) => {
      if (profile && profile.timeZone !== browserZone) setSavedTimeZone(profile.timeZone)
    })
  }, [session.access_token, browserZone])

  const acceptBrowserZone = async () => {
    const result = await updateProfile(session.access_token, { timeZone: browserZone })
    if (result.ok) setSavedTimeZone(null)
  }

  return (
    <section className="flex flex-col items-start gap-3">
      {savedTimeZone && (
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <p>
            Your browser says you're in {browserZone}, but your profile says {savedTimeZone}.
          </p>
          <div className="flex gap-2">
            <Button onClick={acceptBrowserZone}>Use {browserZone}</Button>
            <Button variant="outline" onClick={() => setSavedTimeZone(null)}>
              Keep {savedTimeZone}
            </Button>
          </div>
        </div>
      )}
      <p>Signed in{session.user.email ? ` as ${session.user.email}` : ''}.</p>
      <Link to="/settings" className="underline">
        Settings
      </Link>
      <Button variant="outline" onClick={() => supabase.auth.signOut()}>
        Sign out
      </Button>
    </section>
  )
}
