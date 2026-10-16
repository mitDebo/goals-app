import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listRuns, setAchieved, type RunList } from '@/runs/api'
import { RunSheet } from '@/runs/RunSheet'

type State = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; list: RunList }

// The home page's sheets: one per run that hasn't finished yet (current ones and ones starting later).
export function ActiveRuns({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    listRuns(token).then((list) => setState(list ? { kind: 'loaded', list } : { kind: 'failed' }))
  }, [token])

  if (state.kind === 'loading') return <p>Loading your plans…</p>
  if (state.kind === 'failed')
    return (
      <p role="alert" className="text-destructive">
        Couldn't load your runs.
      </p>
    )

  const { today } = state.list
  const active = state.list.runs.filter((r) => r.endDate >= today)

  // Change the box straight away, then tell the server. If the server says no, put it back.
  const changeTick = (runId: string, goalId: string, date: string, done: boolean) =>
    setState((s) => {
      if (s.kind !== 'loaded') return s
      const runs = s.list.runs.map((r) =>
        r.id !== runId
          ? r
          : {
              ...r,
              achievements: done
                ? [...r.achievements, { goalId, date }]
                : r.achievements.filter((a) => !(a.goalId === goalId && a.date === date)),
            },
      )
      return { kind: 'loaded', list: { ...s.list, runs } }
    })

  const toggle = async (runId: string, goalId: string, date: string, done: boolean) => {
    setSaveFailed(false)
    changeTick(runId, goalId, date, done)
    if (!(await setAchieved(token, runId, goalId, date, done))) {
      changeTick(runId, goalId, date, !done)
      setSaveFailed(true)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {saveFailed && (
        <p role="alert" className="text-destructive">
          Couldn't save that tick. Try again.
        </p>
      )}
      {active.length === 0 ? (
        <p>
          Nothing running right now.{' '}
          <Link to="/plans" className="underline">
            Start a plan
          </Link>
          .
        </p>
      ) : (
        active.map((run) => (
          <RunSheet key={run.id} run={run} today={today} onToggle={(g, d, done) => toggle(run.id, g, d, done)} />
        ))
      )}
    </div>
  )
}
