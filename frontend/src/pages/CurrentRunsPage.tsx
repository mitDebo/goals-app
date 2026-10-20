import type { Session } from '@supabase/supabase-js'
import { RunList } from '@/runs/RunList'

// The tick sheets that used to be on home, kept reachable from the menu while home is being redesigned.
export function CurrentRunsPage({ session }: { session: Session }) {
  return (
    <section className="flex flex-col items-start gap-4">
      <h2 className="text-xl font-semibold">Current runs</h2>
      <RunList token={session.access_token} which="active" />
    </section>
  )
}
