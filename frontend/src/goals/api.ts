import { apiFetch } from '@/api/client'

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
