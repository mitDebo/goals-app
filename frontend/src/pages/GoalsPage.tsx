import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { describeKind, listGoals, type Goal } from '@/goals/api'

type State = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; goals: Goal[] }

// Your goals, in the order the server keeps them (which is the order you chose).
export function GoalsPage({ session }: { session: Session }) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    listGoals(session.access_token).then((goals) =>
      setState(goals ? { kind: 'loaded', goals } : { kind: 'failed' }),
    )
  }, [session.access_token])

  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="text-xl font-semibold">Your goals</h2>

      {state.kind === 'loading' && <p>Loading…</p>}
      {state.kind === 'failed' && (
        <p role="alert" className="text-destructive">
          Couldn't load your goals.
        </p>
      )}
      {state.kind === 'loaded' && state.goals.length === 0 && <p>No goals yet.</p>}
      {state.kind === 'loaded' && state.goals.length > 0 && (
        <ul aria-label="Your goals" className="flex w-full max-w-md flex-col gap-2">
          {state.goals.map((goal) => (
            <li key={goal.id} className="rounded-md border p-3">
              <h3 className="font-medium">{goal.name}</h3>
              <p className="text-sm text-muted-foreground">{describeKind(goal)}</p>
            </li>
          ))}
        </ul>
      )}

      <Link to="/" className="underline">
        Back
      </Link>
    </section>
  )
}
