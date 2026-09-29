import { useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/api/client'
import { supabase } from '@/auth/supabase'

// Inside the app. On arrival, make sure our backend has a profile for this
// person (created with their browser's time zone the first time).
export function HomePage({ session }: { session: Session }) {
  const profileEnsuredFor = useRef<string | null>(null)

  useEffect(() => {
    if (profileEnsuredFor.current === session.access_token) return
    profileEnsuredFor.current = session.access_token

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    apiFetch('/api/me', session.access_token, {
      method: 'POST',
      body: JSON.stringify({ timeZone }),
    })
  }, [session.access_token])

  return (
    <section className="flex flex-col items-start gap-3">
      <p>Signed in{session.user.email ? ` as ${session.user.email}` : ''}.</p>
      <Button variant="outline" onClick={() => supabase.auth.signOut()}>
        Sign out
      </Button>
    </section>
  )
}
