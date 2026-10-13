import type { Session } from '@supabase/supabase-js'
import { createGoal } from '@/goals/api'
import { GoalForm } from '@/goals/GoalForm'

export function NewGoalPage({ session }: { session: Session }) {
  return <GoalForm title="New goal" save={(draft) => createGoal(session.access_token, draft)} />
}
