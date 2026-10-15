import type { Session } from '@supabase/supabase-js'
import { createPlan } from '@/plans/api'
import { PlanForm } from '@/plans/PlanForm'

export function NewPlanPage({ session }: { session: Session }) {
  const token = session.access_token
  return <PlanForm title="New plan" token={token} save={(draft) => createPlan(token, draft)} />
}
