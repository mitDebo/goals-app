import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { getGoal, updateGoal, type Goal } from '@/goals/api'
import { GoalForm } from '@/goals/GoalForm'

type State = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; goal: Goal }

// Loads the goal, then shows the same form as "New goal", filled in with it.
export function EditGoalPage({ session }: { session: Session }) {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    getGoal(session.access_token, id).then((goal) => setState(goal ? { kind: 'loaded', goal } : { kind: 'failed' }))
  }, [session.access_token, id])

  if (state.kind === 'loading') return <p>Loading…</p>
  if (state.kind === 'failed')
    return (
      <section className="flex flex-col items-start gap-3">
        <p role="alert" className="text-destructive">
          Couldn't load this goal.
        </p>
        <Link to="/goals" className="underline">
          Back to your goals
        </Link>
      </section>
    )

  return (
    <GoalForm
      key={state.goal.id}
      title="Edit goal"
      initial={state.goal}
      save={(draft) => updateGoal(session.access_token, id, draft)}
    />
  )
}
