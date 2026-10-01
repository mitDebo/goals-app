import { apiFetch, readFieldErrors, type FieldErrors } from '@/api/client'

// A goal as the server sends it. Only the block for the goal's type is present.
export type Goal = {
  id: string
  name: string
  description?: string
  type: 'boolean' | 'range' | 'number' | 'enum'
  displayStyle: string
  position: number
  range?: { min: number; max: number; minLabel?: string; maxLabel?: string }
  number?: { unit?: string }
  enum?: { ordered: boolean; options: { id: string; label: string; note?: string; isTarget: boolean }[] }
  target?: { comparison: 'at_least' | 'at_most'; value: number }
}

// Your goals in your chosen order, or null if they couldn't be loaded.
export async function listGoals(token: string): Promise<Goal[] | null> {
  try {
    const res = await apiFetch('/api/goals', token)
    return res.ok ? ((await res.json()) as Goal[]) : null
  } catch {
    return null
  }
}

// A few words saying what kind of answer a goal takes, e.g. "1 to 10" or "Number (miles)".
export function describeKind(goal: Goal): string {
  switch (goal.type) {
    case 'boolean':
      return 'Yes / no'
    case 'range':
      return `${goal.range?.min} to ${goal.range?.max}`
    case 'number':
      return goal.number?.unit ? `Number (${goal.number.unit})` : 'Number'
    case 'enum':
      return goal.enum?.options.map((option) => option.label).join(' ') ?? ''
  }
}

// What the form sends to create a goal. Only the block for the chosen type is included.
export type GoalDraft = {
  name: string
  description?: string
  type: Goal['type']
  displayStyle?: string
  range?: { min?: number; max?: number; minLabel?: string; maxLabel?: string }
  number?: { unit?: string }
  enum?: { ordered: boolean; options: { label: string }[] }
}

export type SaveGoalResult = { ok: true; goal: Goal } | { ok: false; errors: FieldErrors }

// On a 400, returns the server's messages keyed by field ("name", "range.max", ...).
export async function createGoal(token: string, draft: GoalDraft): Promise<SaveGoalResult> {
  try {
    const res = await apiFetch('/api/goals', token, { method: 'POST', body: JSON.stringify(draft) })
    if (res.ok) return { ok: true, goal: (await res.json()) as Goal }
    const errors = await readFieldErrors(res)
    return { ok: false, errors: Object.keys(errors).length ? errors : { '': ["Couldn't save the goal."] } }
  } catch {
    return { ok: false, errors: { '': ["Couldn't reach the server. Try again."] } }
  }
}
