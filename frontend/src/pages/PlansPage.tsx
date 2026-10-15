import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { describeFrequency, listPlans, type Plan } from '@/plans/api'

type State = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; plans: Plan[] }

export function PlansPage({ session }: { session: Session }) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    listPlans(session.access_token).then((plans) => setState(plans ? { kind: 'loaded', plans } : { kind: 'failed' }))
  }, [session.access_token])

  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="text-xl font-semibold">Your plans</h2>
      <Link to="/plans/new" className="underline">
        New plan
      </Link>

      {state.kind === 'loading' && <p>Loading…</p>}
      {state.kind === 'failed' && (
        <p role="alert" className="text-destructive">
          Couldn't load your plans.
        </p>
      )}
      {state.kind === 'loaded' && state.plans.length === 0 && <p>No plans yet.</p>}
      {state.kind === 'loaded' && state.plans.length > 0 && (
        <ul aria-label="Your plans" className="flex w-full max-w-md flex-col gap-2">
          {state.plans.map((plan) => (
            <li key={plan.id} className="rounded-md border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium">{plan.name}</h3>
                <Link to={`/plans/${plan.id}/edit`} aria-label={`Edit ${plan.name}`} className="text-sm underline">
                  Edit
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">{plan.lengthDays} days</p>
              <ul className="text-sm">
                {plan.goals.map((g) => (
                  <li key={g.goalId}>
                    {g.goalName}: {describeFrequency(g)}
                  </li>
                ))}
              </ul>
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
