import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { FieldErrors } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/Field'
import { listGoals, type Goal } from '@/goals/api'
import type { Plan, PlanDraft, SavePlanResult } from '@/plans/api'

const inputClass = 'rounded-md border bg-background px-2 py-1'

// One goal row in the form. Both settings are kept while you switch between them, so flipping
// "days" ↔ "times" doesn't lose what you picked.
type Row = { goalId: string; goalName: string; mode: 'days' | 'times'; days: number[]; times: string }

type Props = {
  title: string
  token: string
  initial?: Plan
  save: (draft: PlanDraft) => Promise<SavePlanResult>
}

export function PlanForm({ title, token, initial, save }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState(initial?.name ?? '')
  const [length, setLength] = useState(String(initial?.lengthDays ?? 7))
  const [rows, setRows] = useState<Row[]>(
    initial?.goals.map((g) => ({
      goalId: g.goalId,
      goalName: g.goalName,
      mode: g.days ? 'days' : 'times',
      days: g.days ?? [],
      times: String(g.times ?? 1),
    })) ?? [],
  )
  const [goals, setGoals] = useState<Goal[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  // The goals you can add: your yes/no goals that aren't in the plan yet.
  useEffect(() => {
    listGoals(token).then((all) => setGoals((all ?? []).filter((g) => g.type === 'boolean')))
  }, [token])
  const addable = goals.filter((g) => !rows.some((r) => r.goalId === g.id))

  const lengthDays = Math.max(0, Math.floor(Number(length)) || 0)
  const dayNumbers = Array.from({ length: Math.min(lengthDays, 366) }, (_, i) => i + 1)

  const updateRow = (index: number, changes: Partial<Row>) =>
    setRows(rows.map((r, i) => (i === index ? { ...r, ...changes } : r)))
  const toggleDay = (index: number, day: number) => {
    const days = rows[index].days
    updateRow(index, { days: days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b) })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const result = await save({
      name,
      lengthDays,
      goals: rows.map((r) =>
        r.mode === 'days'
          ? // Days past the end (after shortening the plan) are dropped rather than rejected.
            { goalId: r.goalId, days: r.days.filter((d) => d <= lengthDays) }
          : { goalId: r.goalId, times: Number(r.times) },
      ),
    })
    setSaving(false)
    if (result.ok) navigate('/plans')
    else setErrors(result.errors)
  }

  const shownHere = (key: string) => key === 'name' || key === 'lengthDays' || key.startsWith('goals')
  const otherErrors = Object.entries(errors)
    .filter(([key]) => !shownHere(key))
    .flatMap(([, messages]) => messages)
  const rowErrors = (i: number) =>
    Object.entries(errors)
      .filter(([key]) => key === `goals[${i}]` || key.startsWith(`goals[${i}].`))
      .flatMap(([, messages]) => messages)

  return (
    <section className="flex flex-col items-start gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      {otherErrors.length > 0 && (
        <p role="alert" className="text-destructive">
          {otherErrors.join(' ')}
        </p>
      )}

      <form onSubmit={submit} className="flex w-full max-w-xl flex-col gap-4" noValidate>
        <Field id="plan-name" label="Name" errors={errors.name}>
          {(props) => <input {...props} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field id="plan-length" label="Length in days" errors={errors.lengthDays}>
          {(props) => (
            <input
              {...props}
              type="number"
              min={1}
              className={`${inputClass} w-24`}
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          )}
        </Field>

        <div className="flex flex-col gap-3">
          <h3 className="font-medium">Goals</h3>
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No goals in this plan yet.</p>}

          {rows.map((row, i) => (
            <div key={row.goalId} className="flex flex-col gap-2 rounded-md border p-3" aria-label={row.goalName} role="group">
              <div className="flex items-center justify-between">
                <span className="font-medium">{row.goalName}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              </div>

              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1">
                  <input type="radio" name={`mode-${row.goalId}`} checked={row.mode === 'days'} onChange={() => updateRow(i, { mode: 'days' })} />
                  On these days
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name={`mode-${row.goalId}`} checked={row.mode === 'times'} onChange={() => updateRow(i, { mode: 'times' })} />
                  A number of times, any days
                </label>
              </div>

              {row.mode === 'days' ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {dayNumbers.map((day) => (
                      <label key={day} className="flex items-center gap-1 text-sm">
                        <input type="checkbox" checked={row.days.includes(day)} onChange={() => toggleDay(i, day)} />
                        Day {day}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => updateRow(i, { days: dayNumbers })}>
                      Every day
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => updateRow(i, { days: dayNumbers.filter((d) => d % 2 === 1) })}>
                      Every other day
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => updateRow(i, { days: [] })}>
                      Clear
                    </Button>
                  </div>
                </>
              ) : (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    min={1}
                    className={`${inputClass} w-20`}
                    value={row.times}
                    onChange={(e) => updateRow(i, { times: e.target.value })}
                  />
                  times during the plan
                </label>
              )}

              {rowErrors(i).length > 0 && <p className="text-sm text-destructive">{rowErrors(i).join(' ')}</p>}
            </div>
          ))}

          {errors.goals?.length ? <p className="text-sm text-destructive">{errors.goals.join(' ')}</p> : null}

          {addable.length > 0 ? (
            <label className="flex items-center gap-2 text-sm">
              Add a goal
              <select
                className={inputClass}
                value=""
                onChange={(e) => {
                  const goal = addable.find((g) => g.id === e.target.value)
                  if (goal) setRows([...rows, { goalId: goal.id, goalName: goal.name, mode: 'days', days: [], times: '1' }])
                }}
              >
                <option value="">Choose…</option>
                {addable.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            goals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You don't have any yes/no goals yet. <Link to="/goals/new" className="underline">Create one</Link>.
              </p>
            )
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            Save
          </Button>
          <Link to="/plans" className="underline">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
