import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { ChoiceSettings, NumberSettings } from '@/week/goalKinds'
import { problemWith, startingValue } from '@/week/numbers'
import { NumberEntry } from '@/week/widgets/NumberEntry'
import { NumberDial } from '@/week/widgets/NumberDial'
import { NumberSlider } from '@/week/widgets/NumberSlider'
import { ChoiceButtons, ChoiceDropdown, ChoiceWheel } from '@/week/widgets/ChoicePickers'

const corners = 'rounded-[5px]'

// A goal + day being recorded: a number goal (its value is a number) or a choice goal (its value is the
// chosen option's emoji). `value` is what's recorded already, if anything.
export type Recording = {
  goalName: string
  // "Mon, 19 Oct 2026"
  dayLabel: string
} & ({ kind: 'number'; settings: NumberSettings; value?: number } | { kind: 'choice'; settings: ChoiceSettings; value?: string })

// The box that opens when you tap a number or choice goal's day: the goal's input widget (number box, dial or
// slider; buttons, dropdown or wheel), then OK to save, Cancel to leave it as it was, or Clear (only when
// something's recorded) to empty the day.
export function RecordDialog({
  recording,
  onSave,
  onClear,
  onClose,
}: {
  recording: Recording | null
  onSave: (value: number | string) => void
  onClear: () => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const open = recording !== null

  useEffect(() => {
    const box = dialog.current
    if (!box) return
    if (open && !box.open) box.showModal()
    if (!open && box.open) box.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="record-title"
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      className="m-auto w-[calc(100%-1.5rem)] max-w-sm overflow-hidden rounded-xl border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/60"
    >
      {recording?.kind === 'number' && (
        <NumberForm recording={recording} onSave={onSave} onClear={onClear} onClose={onClose} />
      )}
      {recording?.kind === 'choice' && (
        <ChoiceForm recording={recording} onSave={onSave} onClear={onClear} onClose={onClose} />
      )}
    </dialog>
  )
}

type FormProps<R> = {
  recording: R
  onSave: (value: number | string) => void
  onClear: () => void
  onClose: () => void
}

// The banner: which goal, which day.
function Banner({ recording }: { recording: Recording }) {
  return (
    <div className="border-b bg-header px-5 py-3">
      <h2 id="record-title" className="text-xl font-semibold">
        {recording.goalName}
      </h2>
      <p className="text-sm text-muted-foreground">{recording.dayLabel}</p>
    </div>
  )
}

// Clear (only when something's recorded), Cancel and OK.
function Buttons({ canClear, canSave = true, onClear, onClose }: { canClear: boolean; canSave?: boolean; onClear: () => void; onClose: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      {canClear && (
        <Button
          type="button"
          variant="outline"
          className={`${corners} mr-auto`}
          onClick={() => {
            onClear()
            onClose()
          }}
        >
          Clear
        </Button>
      )}
      <Button type="button" variant="outline" className={corners} onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" className={corners} disabled={!canSave}>
        OK
      </Button>
    </div>
  )
}

function NumberForm({ recording, onSave, onClear, onClose }: FormProps<Extract<Recording, { kind: 'number' }>>) {
  const { settings } = recording
  // Starts at what's recorded, or where a new value starts.
  const [text, setText] = useState(String(recording.value ?? startingValue(settings)))
  const [error, setError] = useState<string>()
  const { min, max, minLabel, maxLabel } = settings

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = text.trim() === '' ? NaN : Number(text)
    const problem = problemWith(value, settings)
    if (problem) return setError(problem)
    onSave(value)
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate>
      <Banner recording={recording} />
      <div className="flex flex-col gap-3 p-5">
        {/* The goal's input: a dial, a slider (only possible with both ends), or the number box. */}
        {settings.show === 'dial' ? (
          <NumberDial
            id="record-value"
            value={Number(text)}
            onChange={(value) => {
              setText(String(value))
              setError(undefined)
            }}
            settings={settings}
          />
        ) : settings.show === 'slider' && min !== undefined && max !== undefined ? (
          <NumberSlider
            id="record-value"
            value={Number(text)}
            onChange={(value) => {
              setText(String(value))
              setError(undefined)
            }}
            settings={{ ...settings, min, max }}
          />
        ) : (
          <NumberEntry
            id="record-value"
            text={text}
            onChange={(next) => {
              setText(next)
              setError(undefined)
            }}
            settings={settings}
          />
        )}
        {/* The number box's allowed range, with the end labels when there are any (the slider shows its own). */}
        {settings.show !== 'slider' && settings.show !== 'dial' && (min !== undefined || max !== undefined) && (
          <p className="text-center text-xs text-muted-foreground">
            {min !== undefined && `${min}${minLabel ? ` = ${minLabel}` : ''}`}
            {min !== undefined && max !== undefined && '  ·  '}
            {max !== undefined && `${max}${maxLabel ? ` = ${maxLabel}` : ''}`}
          </p>
        )}
        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}
        <Buttons canClear={recording.value !== undefined} onClear={onClear} onClose={onClose} />
      </div>
    </form>
  )
}

function ChoiceForm({ recording, onSave, onClear, onClose }: FormProps<Extract<Recording, { kind: 'choice' }>>) {
  const { options, show } = recording.settings
  // Starts on what's recorded. Otherwise nothing's chosen, except the wheel, which always has an option in
  // its middle: it starts on the first.
  const [chosen, setChosen] = useState(recording.value ?? (show === 'wheel' ? (options[0]?.emoji ?? '') : ''))
  const picker = { id: 'record-value', options, value: chosen, onChange: setChosen }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!chosen) return
    onSave(chosen)
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate>
      <Banner recording={recording} />
      <div className="flex flex-col gap-4 p-5">
        {show === 'dropdown' ? (
          <ChoiceDropdown {...picker} />
        ) : show === 'wheel' ? (
          <ChoiceWheel {...picker} />
        ) : (
          <ChoiceButtons {...picker} />
        )}
        <Buttons canClear={recording.value !== undefined} canSave={chosen !== ''} onClear={onClear} onClose={onClose} />
      </div>
    </form>
  )
}
