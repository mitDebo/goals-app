import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import type { FieldErrors } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/Field'
import { getPlan, type Plan } from '@/plans/api'
import { getProfile } from '@/profile/api'
import { startRun } from '@/runs/api'
import { addDays } from '@/runs/dates'

const inputClass = 'rounded-md border bg-background px-2 py-1'

type Loaded = { plan: Plan; today: string }
type State = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; data: Loaded }

// Start a plan on a date (past or future). The end date follows the start date until you change it yourself.
export function StartRunPage({ session }: { session: Session }) {
  const { id = '' } = useParams()
  const token = session.access_token
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    Promise.all([getPlan(token, id), getProfile(token)]).then(([plan, profile]) =>
      setState(plan && profile ? { kind: 'loaded', data: { plan, today: profile.today } } : { kind: 'failed' }),
    )
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
  return <StartRunForm token={token} {...state.data} />
}

function StartRunForm({ token, plan, today }: Loaded & { token: string }) {
  const navigate = useNavigate()
  const lastDay = (start: string) => addDays(start, plan.lengthDays - 1)
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(lastDay(today))
  const [endEdited, setEndEdited] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const changeStart = (value: string) => {
    setStart(value)
    if (!endEdited && value) setEnd(lastDay(value))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const result = await startRun(token, { planId: plan.id, startDate: start, endDate: end })
    setSaving(false)
    if (result.ok) navigate('/')
    else setErrors(result.errors)
  }

  const otherErrors = Object.entries(errors)
    .filter(([key]) => key !== 'startDate' && key !== 'endDate')
    .flatMap(([, messages]) => messages)

  return (
    <section className="flex flex-col items-start gap-4">
      <h2 className="text-xl font-semibold">Start {plan.name}</h2>
      <p className="text-muted-foreground">
        {plan.lengthDays} days. Day 1 is the start date. It can be in the past or the future.
      </p>

      {otherErrors.length > 0 && (
        <p role="alert" className="text-destructive">
          {otherErrors.join(' ')}
        </p>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field id="run-start" label="Start date" errors={errors.startDate}>
          {(props) => (
            <input {...props} type="date" className={inputClass} value={start} onChange={(e) => changeStart(e.target.value)} />
          )}
        </Field>
        <Field id="run-end" label="End date" errors={errors.endDate}>
          {(props) => (
            <input
              {...props}
              type="date"
              className={inputClass}
              value={end}
              onChange={(e) => {
                setEnd(e.target.value)
                setEndEdited(true)
              }}
            />
          )}
        </Field>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            Start
          </Button>
          <Link to="/plans" className="underline">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
