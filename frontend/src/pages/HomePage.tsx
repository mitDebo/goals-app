import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { browserTimeZone, ensureProfile, updateProfile, type Profile } from '@/profile/api'
import { WeekTable } from '@/week/WeekTable'

// Inside the app. On arrival, make sure our backend has a profile for this
// person, and offer to fix it if their browser is now in another time zone.
// Then show this week's table, which needs the profile for "today" and the first day of the week.
export function HomePage({ session }: { session: Session }) {
  const profileEnsuredFor = useRef<string | null>(null)
  const [savedTimeZone, setSavedTimeZone] = useState<string | null>(null)
  const [profileFailed, setProfileFailed] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const browserZone = browserTimeZone()

  useEffect(() => {
    if (profileEnsuredFor.current === session.access_token) return
    profileEnsuredFor.current = session.access_token

    ensureProfile(session.access_token).then((profile) => {
      if (!profile) return setProfileFailed(true)
      setProfile(profile)
      if (profile.timeZone !== browserZone) setSavedTimeZone(profile.timeZone)
    })
  }, [session.access_token, browserZone])

  const acceptBrowserZone = async () => {
    const result = await updateProfile(session.access_token, { timeZone: browserZone })
    if (result.ok) {
      setSavedTimeZone(null)
      // A new time zone can mean a different "today".
      setProfile(result.profile)
    }
  }

  return (
    <section className="flex flex-col items-start gap-3">
      {profileFailed && (
        <p role="alert" className="text-destructive">
          We couldn't load your profile. Try refreshing the page.
        </p>
      )}
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
      {profile ? <WeekTable today={profile.today} weekStart={profile.weekStart} /> : !profileFailed && <p>Loading…</p>}
    </section>
  )
}
