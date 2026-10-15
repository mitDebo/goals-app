import { apiFetch, readFieldErrors, type FieldErrors } from '@/api/client'

// A goal in a plan is due either on certain plan days (1 = the run's start date) or N times, any days.
export type PlanGoal = { goalId: string; goalName: string; days?: number[]; times?: number }
export type Plan = { id: string; name: string; lengthDays: number; goals: PlanGoal[] }

export type PlanDraft = {
  name: string
  lengthDays: number
  goals: { goalId: string; days?: number[]; times?: number }[]
}

export type SavePlanResult = { ok: true; plan: Plan } | { ok: false; errors: FieldErrors }

export async function listPlans(token: string): Promise<Plan[] | null> {
  try {
    const res = await apiFetch('/api/plans', token)
    return res.ok ? ((await res.json()) as Plan[]) : null
  } catch {
    return null
  }
}

export async function getPlan(token: string, id: string): Promise<Plan | null> {
  try {
    const res = await apiFetch(`/api/plans/${encodeURIComponent(id)}`, token)
    return res.ok ? ((await res.json()) as Plan) : null
  } catch {
    return null
  }
}

export const createPlan = (token: string, draft: PlanDraft) => sendPlan(token, '/api/plans', 'POST', draft)

export const updatePlan = (token: string, id: string, draft: PlanDraft) =>
  sendPlan(token, `/api/plans/${encodeURIComponent(id)}`, 'PUT', draft)

async function sendPlan(token: string, path: string, method: string, draft: PlanDraft): Promise<SavePlanResult> {
  try {
    const res = await apiFetch(path, token, { method, body: JSON.stringify(draft) })
    if (res.ok) return { ok: true, plan: (await res.json()) as Plan }
    const errors = await readFieldErrors(res)
    return { ok: false, errors: Object.keys(errors).length ? errors : { '': ["Couldn't save the plan."] } }
  } catch {
    return { ok: false, errors: { '': ["Couldn't reach the server. Try again."] } }
  }
}

// "Days 1, 3, 4" or "3 times, any days".
export const describeFrequency = (goal: { days?: number[]; times?: number }) =>
  goal.days ? `Day${goal.days.length > 1 ? 's' : ''} ${goal.days.join(', ')}` : `${goal.times} time${goal.times === 1 ? '' : 's'}, any days`
