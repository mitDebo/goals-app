import { Link } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { RunList } from '@/runs/RunList'

// Runs whose last day has passed. Still tickable, and still editable: moving the end date
// into the future sends a run back to the home page.
export function PastRunsPage({ session }: { session: Session }) {
  return (
    <section className="flex flex-col items-start gap-4">
      <h2 className="text-xl font-semibold">Past runs</h2>
      <RunList token={session.access_token} which="past" />
      <Link to="/" className="underline">
        Back
      </Link>
    </section>
  )
}
