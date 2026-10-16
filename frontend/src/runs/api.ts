import { apiFetch, readFieldErrors, type FieldErrors } from '@/api/client'
import type { PlanGoal } from '@/plans/api'

export type Achievement = { goalId: string; date: string }

// A plan started on a date. Its goals are the plan's current goals (edit the plan, every run changes).
export type Run = {
  id: string
  planId: string
  planName: string
  startDate: string
  endDate: string
  goals: PlanGoal[]
  achievements: Achievement[]
}

// "today" is the user's today, in the time zone saved in their profile.
export type RunList = { today: string; runs: Run[] }

export async function listRuns(token: string): Promise<RunList | null> {
  try {
    const res = await apiFetch('/api/runs', token)
    return res.ok ? ((await res.json()) as RunList) : null
  } catch {
    return null
  }
}

export type StartRunResult = { ok: true; run: Run } | { ok: false; errors: FieldErrors }

export async function startRun(
  token: string,
  draft: { planId: string; startDate: string; endDate: string },
): Promise<StartRunResult> {
  try {
    const res = await apiFetch('/api/runs', token, { method: 'POST', body: JSON.stringify(draft) })
    if (res.ok) return { ok: true, run: (await res.json()) as Run }
    const errors = await readFieldErrors(res)
    return { ok: false, errors: Object.keys(errors).length ? errors : { '': ["Couldn't start the plan."] } }
  } catch {
    return { ok: false, errors: { '': ["Couldn't reach the server. Try again."] } }
  }
}

// Tick (done = true) or untick one goal on one day. Resolves to whether the server agreed.
export async function setAchieved(token: string, runId: string, goalId: string, date: string, done: boolean) {
  try {
    const path = `/api/runs/${encodeURIComponent(runId)}/achievements/${encodeURIComponent(goalId)}/${date}`
    const res = await apiFetch(path, token, { method: done ? 'PUT' : 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export type ChangeEndResult = { ok: true; run: Run } | { ok: false; errors: string[] }

export async function changeRunEnd(token: string, runId: string, endDate: string): Promise<ChangeEndResult> {
  try {
    const res = await apiFetch(`/api/runs/${encodeURIComponent(runId)}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ endDate }),
    })
    if (res.ok) return { ok: true, run: (await res.json()) as Run }
    const errors = Object.values(await readFieldErrors(res)).flat()
    return { ok: false, errors: errors.length ? errors : ["Couldn't change the end date."] }
  } catch {
    return { ok: false, errors: ["Couldn't reach the server. Try again."] }
  }
}

// Deletes the run and all its ticks. Resolves to whether it worked.
export async function deleteRun(token: string, runId: string) {
  try {
    const res = await apiFetch(`/api/runs/${encodeURIComponent(runId)}`, token, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}
