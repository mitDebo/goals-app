import type { PlanGoal } from '@/plans/api'

// What one box on the sheet shows:
// - done:   due that day, and ticked
// - due:    due that day, not ticked yet
// - bonus:  ticked on a day it wasn't due
// - off:    not due, not ticked (can still be ticked, as a bonus)
// - open:   a "N times, any days" goal: any day counts, not ticked
// - future: a day that hasn't happened yet (can't be ticked)
export type CellKind = 'done' | 'due' | 'bonus' | 'off' | 'open' | 'future'

// dayNumber: 1 = the run's start date.
export function cellKind(goal: PlanGoal, dayNumber: number, ticked: boolean, isFuture: boolean): CellKind {
  if (isFuture) return 'future'
  if (!goal.days) return ticked ? 'done' : 'open'
  const due = goal.days.includes(dayNumber)
  if (due) return ticked ? 'done' : 'due'
  return ticked ? 'bonus' : 'off'
}

export const cellLabel: Record<CellKind, string> = {
  done: 'done',
  due: 'due, not done',
  bonus: 'bonus, done',
  off: 'not due',
  open: 'not done',
  future: "hasn't happened yet",
}
