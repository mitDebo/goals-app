import type { Run } from '@/runs/api'
import { addDays, daysBetween, shortDate } from '@/runs/dates'
import { cellKind, cellLabel, type CellKind } from '@/runs/sheet'
import { describeFrequency } from '@/plans/api'
import { RunActions } from '@/runs/RunActions'

// What each kind of box looks like. Ticked boxes are filled; bonus ticks get a dashed outline.
const cellStyle: Record<CellKind, string> = {
  done: 'bg-primary text-primary-foreground border-primary',
  due: 'border-2 border-foreground/60',
  bonus: 'border-2 border-dashed border-primary text-primary',
  off: 'border border-dotted border-muted-foreground/40',
  open: 'border border-foreground/40',
  future: 'bg-muted border-transparent cursor-not-allowed',
}

type Props = {
  run: Run
  today: string
  onToggle: (goalId: string, date: string, done: boolean) => void
  onChangeEnd: (endDate: string) => Promise<string[]>
  onDelete: () => Promise<boolean>
}

// One run as a grid: goals down the side, the run's days across the top. Tap a box to tick or untick it.
export function RunSheet({ run, today, onToggle, onChangeEnd, onDelete }: Props) {
  const length = daysBetween(run.startDate, run.endDate) + 1
  const dates = Array.from({ length }, (_, i) => addDays(run.startDate, i))
  const ticked = new Set(run.achievements.map((a) => `${a.goalId}|${a.date}`))
  const notStarted = run.startDate > today

  return (
    <section aria-label={run.planName} className="flex w-full flex-col gap-2">
      <h3 className="text-lg font-semibold">
        {run.planName}{' '}
        <span className="text-sm font-normal text-muted-foreground">
          {shortDate(run.startDate)} – {shortDate(run.endDate)}
          {notStarted && ` · starts ${shortDate(run.startDate)}`}
        </span>
      </h3>

      {run.goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">This plan has no goals yet.</p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <table className="border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-background text-left font-medium">Goal</th>
                {dates.map((date, i) => (
                  <th
                    key={date}
                    scope="col"
                    className={`min-w-10 text-center font-normal ${date === today ? 'rounded bg-accent font-semibold' : ''}`}
                  >
                    <div>Day {i + 1}</div>
                    <div className="text-xs text-muted-foreground">{shortDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {run.goals.map((goal) => {
                const count = run.achievements.filter((a) => a.goalId === goal.goalId).length
                return (
                  <tr key={goal.goalId}>
                    <th scope="row" className="sticky left-0 bg-background pr-2 text-left font-normal whitespace-nowrap">
                      <div>{goal.goalName}</div>
                      <div className="text-xs text-muted-foreground">
                        {goal.times ? `${count} of ${goal.times}` : describeFrequency(goal)}
                      </div>
                    </th>
                    {dates.map((date, i) => {
                      const isTicked = ticked.has(`${goal.goalId}|${date}`)
                      const kind = cellKind(goal, i + 1, isTicked, date > today)
                      return (
                        <td key={date} className="text-center">
                          <button
                            type="button"
                            aria-label={`${goal.goalName}, ${shortDate(date)}: ${cellLabel[kind]}`}
                            aria-pressed={isTicked}
                            disabled={kind === 'future'}
                            onClick={() => onToggle(goal.goalId, date, !isTicked)}
                            className={`size-8 rounded-md ${cellStyle[kind]}`}
                          >
                            {isTicked ? '✓' : ''}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <RunActions runName={run.planName} endDate={run.endDate} onChangeEnd={onChangeEnd} onDelete={onDelete} />
    </section>
  )
}
