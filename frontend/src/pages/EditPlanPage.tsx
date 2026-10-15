import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { getPlan, updatePlan, type Plan } from '@/plans/api'
import { PlanForm } from '@/plans/PlanForm'

type State = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; plan: Plan }

export function EditPlanPage({ session }: { session: Session }) {
  const { id = '' } = useParams()
  const token = session.access_token
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    getPlan(token, id).then((plan) => setState(plan ? { kind: 'loaded', plan } : { kind: 'failed' }))
  }, [token, id])

  if (state.kind === 'loading') return <p>Loading…</p>
  if (state.kind === 'failed')
    return (
      <section className="flex flex-col items-start gap-3">
        <p role="alert" className="text-destructive">
          Couldn't load this plan.
        </p>
        <Link to="/plans" className="underline">
          Back to your plans
        </Link>
      </section>
    )

  return (
    <PlanForm
      key={state.plan.id}
      title="Edit plan"
      token={token}
      initial={state.plan}
      save={(draft) => updatePlan(token, id, draft)}
    />
  )
}
