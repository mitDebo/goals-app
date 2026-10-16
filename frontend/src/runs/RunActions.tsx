import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  runName: string
  endDate: string
  // Resolve to error messages, or an empty list when it worked.
  onChangeEnd: (endDate: string) => Promise<string[]>
  // Resolve to whether it worked.
  onDelete: () => Promise<boolean>
}

// The small buttons under a sheet. Each one opens a little panel first, so nothing changes by accident.
export function RunActions({ runName, endDate, onChangeEnd, onDelete }: Props) {
  const [open, setOpen] = useState<'none' | 'end' | 'delete'>('none')
  const [newEnd, setNewEnd] = useState(endDate)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const close = () => {
    setOpen('none')
    setErrors([])
  }

  const saveEnd = async () => {
    setBusy(true)
    const problems = await onChangeEnd(newEnd)
    setBusy(false)
    if (problems.length) setErrors(problems)
    else close()
  }

  const confirmDelete = async () => {
    setBusy(true)
    const worked = await onDelete()
    setBusy(false)
    if (!worked) setErrors(["Couldn't delete this run. Try again."])
  }

  if (open === 'none')
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewEnd(endDate)
            setOpen('end')
          }}
        >
          Change end date
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen('delete')}>
          Delete run
        </Button>
      </div>
    )

  return (
    <div className="flex flex-col items-start gap-2 rounded-md border p-3">
      {open === 'end' ? (
        <label className="flex items-center gap-2 text-sm">
          New end date
          <input
            type="date"
            className="rounded-md border bg-background px-2 py-1"
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
          />
        </label>
      ) : (
        <p className="text-sm">Delete this run of {runName}, and every tick in it? The plan itself stays.</p>
      )}

      {errors.length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          {errors.join(' ')}
        </p>
      )}

      <div className="flex gap-2">
        {open === 'end' ? (
          <Button size="sm" disabled={busy} onClick={saveEnd}>
            Save end date
          </Button>
        ) : (
          <Button size="sm" variant="destructive" disabled={busy} onClick={confirmDelete}>
            Yes, delete it
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={busy} onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
