import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { changeRunEnd, deleteRun, listRuns, setAchieved, type Run, type RunList as Runs } from '@/runs/api'
import { RunSheet } from '@/runs/RunSheet'

type State = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; list: Runs }

// A stack of sheets. "active": runs that haven't finished (current, or starting later), soonest first.
// "past": runs whose last day has gone, most recent first.
export function RunList({ token, which }: { token: string; which: 'active' | 'past' }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    listRuns(token).then((list) => setState(list ? { kind: 'loaded', list } : { kind: 'failed' }))
  }, [token])

  if (state.kind === 'loading') return <p>Loading your runs…</p>
  if (state.kind === 'failed')
    return (
      <p role="alert" className="text-destructive">
        Couldn't load your runs.
      </p>
    )

  const { today } = state.list
  const shown =
    which === 'active'
      ? state.list.runs.filter((r) => r.endDate >= today)
      : state.list.runs.filter((r) => r.endDate < today).reverse()

  // Swap in a changed run, or drop a deleted one (replacement = null).
  const replaceRun = (runId: string, replace: (run: Run) => Run | null) =>
    setState((s) => {
      if (s.kind !== 'loaded') return s
      const runs = s.list.runs.flatMap((r) => {
        if (r.id !== runId) return [r]
        const next = replace(r)
        return next ? [next] : []
      })
      return { kind: 'loaded', list: { ...s.list, runs } }
    })

  // Change the box straight away, then tell the server. If the server says no, put it back.
  const changeTick = (runId: string, goalId: string, date: string, done: boolean) =>
    replaceRun(runId, (r) => ({
      ...r,
      achievements: done
        ? [...r.achievements, { goalId, date }]
        : r.achievements.filter((a) => !(a.goalId === goalId && a.date === date)),
    }))

  const toggle = async (runId: string, goalId: string, date: string, done: boolean) => {
    setSaveFailed(false)
    changeTick(runId, goalId, date, done)
    if (!(await setAchieved(token, runId, goalId, date, done))) {
      changeTick(runId, goalId, date, !done)
      setSaveFailed(true)
    }
  }

  // The server sends back the run with its new dates (and the ticks that fall inside them).
  const changeEnd = async (runId: string, endDate: string) => {
    const result = await changeRunEnd(token, runId, endDate)
    if (!result.ok) return result.errors
    replaceRun(runId, () => result.run)
    return []
  }

  const remove = async (runId: string) => {
    const worked = await deleteRun(token, runId)
    if (worked) replaceRun(runId, () => null)
    return worked
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {saveFailed && (
        <p role="alert" className="text-destructive">
          Couldn't save that tick. Try again.
        </p>
      )}
      {shown.length === 0 &&
        (which === 'active' ? (
          <p>
            Nothing running right now.{' '}
            <Link to="/plans" className="underline">
              Start a plan
            </Link>
            .
          </p>
        ) : (
          <p>No finished runs yet.</p>
        ))}
      {shown.map((run) => (
        <RunSheet
          key={run.id}
          run={run}
          today={today}
          onToggle={(goalId, date, done) => toggle(run.id, goalId, date, done)}
          onChangeEnd={(endDate) => changeEnd(run.id, endDate)}
          onDelete={() => remove(run.id)}
        />
      ))}
    </div>
  )
}
