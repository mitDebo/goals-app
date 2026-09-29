import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from './context'
import { supabase } from './supabase'

// Keeps track of whether someone is signed in, and updates when that changes.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // A sign-in/sign-out event is always newer than the initial check, so once
    // one arrives, a late answer from getSession() must not overwrite it.
    let heardAnEvent = false

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      heardAnEvent = true
      setSession(nextSession)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data }) => {
      if (heardAnEvent) return
      setSession(data.session)
      setLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
}
