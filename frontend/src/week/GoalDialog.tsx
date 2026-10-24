import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { firstEmoji } from '@/week/emoji'
import { ChoicePreview, NumberPreview, TogglePreview } from '@/week/GoalPreview'
import { EmojiPicker } from '@/week/widgets/EmojiPicker'
import type { ChoiceSettings, NewGoal, NumberSettings, ToggleMark } from '@/week/goalKinds'

// Same corners as the login box's buttons and field.
const corners = 'rounded-[5px]'

// Longest goal name allowed (it has to fit two short lines in the grid on a phone).
export const MAX_GOAL_NAME = 15
const MAX_SHORT_TEXT = 15 // units and end labels
const MAX_OPTION = 20

// Text and number boxes: white in both light and dark mode, like the login box's email field.
const field = `${corners} w-full border border-gray-300 bg-white px-2 py-1.5 text-gray-900 [color-scheme:light]`

export type GoalChoice = { id: number; name: string }

type Props = {
  open: boolean
  onClose: () => void
  // The user's goals that aren't in this plan yet.
  available: GoalChoice[]
  onAddExisting: (ids: number[]) => void
  onCreate: (goal: NewGoal) => void
}

// A box that pops up over the page (which goes dark behind it) for adding goals to the plan. Close it
// with Cancel, Esc, or by clicking the dark area. Like the login box, it uses the browser's own <dialog>.
export function GoalDialog({ open, onClose, available, onAddExisting, onCreate }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const box = dialog.current
    if (!box) return
    if (open && !box.open) box.showModal()
    if (!open && box.open) box.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="goal-dialog-title"
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      className="m-auto w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-xl sm:max-w-2xl border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/60"
    >
      {/* Only drawn while open, so it starts fresh each time. */}
      {open && <GoalPicker available={available} onClose={onClose} onAddExisting={onAddExisting} onCreate={onCreate} />}
    </dialog>
  )
}

type Tab = 'existing' | 'toggle' | 'number' | 'choice'
// The tabs, in two groups with a small heading each: "Existing" (Goals) and "New" (Toggle, Number, Choice).
const tabs: { id: Tab; label: string; group: string }[] = [
  { id: 'existing', label: 'Goals', group: 'Existing' },
  { id: 'toggle', label: 'Toggle', group: 'New' },
  { id: 'number', label: 'Number', group: 'New' },
  { id: 'choice', label: 'Choice', group: 'New' },
]

// Tabs down the left; the selected tab's page on the right.
// - Your goals: choose one of your goals that isn't in this plan yet from the dropdown, then Add.
// - New toggle: a yes/no goal; it only needs a name.
// - New number: an amount (pages, km) or a score on a scale (1–10), with optional unit, bounds, end labels
//   and step.
// - New choice: pick one of your own options each day; each option is an emoji, with an optional name.
// The New tabs create the goal (it joins your goals) and add it to the plan.
function GoalPicker({ available, onClose, onAddExisting, onCreate }: Omit<Props, 'open'>) {
  // Start on "Your goals", unless there's nothing left there to add.
  const [tab, setTab] = useState<Tab>(available.length > 0 ? 'existing' : 'toggle')

  // When a page is shown (and when the box opens), put the cursor in its first box.
  const pages = useRef<Partial<Record<Tab, HTMLDivElement | null>>>({})
  // (Waits a frame, so the box has finished opening first; opening it would otherwise put the cursor on
  // the first tab.)
  useEffect(() => {
    const frame = requestAnimationFrame(() => pages.current[tab]?.querySelector<HTMLElement>('input, select')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [tab])

  return (
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
      {/* The banner across the top. */}
      <h2 id="goal-dialog-title" className="border-b bg-header px-5 py-3 text-xl font-semibold">
        Add a goal
      </h2>
      <div className="flex min-h-0 flex-1">
        {/* Tabs down the left edge, like an address book's: a shaded column of bordered tabs, flush with
            the box's edge. The selected tab takes the page's colour and covers the column's right-hand line,
            so it runs straight into its page. */}
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Kind of goal"
          className="flex w-28 shrink-0 flex-col border-r bg-muted"
        >
          {tabs.map((t, index) => [
            // A small heading above the first tab of each group.
            t.group !== tabs[index - 1]?.group && (
              <p
                key={`heading-${t.group}`}
                role="presentation"
                className="border-b bg-foreground/10 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground italic"
              >
                {t.group}
              </p>
            ),
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`goal-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`goal-page-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mr-px border-b px-3 py-3 text-left text-sm ${tab === t.id ? 'relative z-10 border-r border-r-popover bg-popover font-semibold text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}
            >
              {t.label}
            </button>,
          ])}
        </div>
        {/* Every page is here at once, stacked in the same spot, with only the selected one visible. That
            makes the box as tall as the tallest page, whichever it is, so switching tabs never changes its
            size (and each page keeps what you've typed while the box is open). */}
        <div className="grid min-w-0 flex-1 overflow-y-auto">
          {tabs.map((t) => (
            <div
              key={t.id}
              ref={(el) => {
                pages.current[t.id] = el
              }}
              role="tabpanel"
              id={`goal-page-${t.id}`}
              aria-labelledby={`goal-tab-${t.id}`}
              aria-hidden={tab !== t.id}
              className={`col-start-1 row-start-1 flex flex-col p-4 ${tab === t.id ? 'visible' : 'invisible'}`}
            >
              {t.id === 'existing' && <ExistingGoals available={available} onClose={onClose} onAdd={onAddExisting} />}
              {t.id === 'toggle' && <NewToggle onClose={onClose} onCreate={onCreate} />}
              {t.id === 'number' && <NewNumber onClose={onClose} onCreate={onCreate} />}
              {t.id === 'choice' && <NewChoice onClose={onClose} onCreate={onCreate} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ExistingGoals({
  available,
  onClose,
  onAdd,
}: {
  available: GoalChoice[]
  onClose: () => void
  onAdd: (ids: number[]) => void
}) {
  // The goal chosen in the dropdown ('' until one is picked).
  const [picked, setPicked] = useState('')

  const add = (event: FormEvent) => {
    event.preventDefault()
    if (!picked) return
    onAdd([Number(picked)])
    onClose()
  }

  return (
    <form onSubmit={add} className="flex flex-1 flex-col">
      <WithPreview buttons={<Buttons onClose={onClose} label="Add" disabled={!picked} />}>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">All your goals are already in this plan.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="existing-goal" className="text-sm font-medium">
              Goal
            </label>
            {/* White in both light and dark mode, like the name boxes on the New tabs. */}
            <select
              id="existing-goal"
              value={picked}
              onChange={(event) => setPicked(event.target.value)}
              className={field}
            >
              <option value="" disabled>
                Choose a goal…
              </option>
              {available.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </WithPreview>
    </form>
  )
}

// A New tab's page: the settings, with the live preview and the Cancel/New buttons. On a phone the preview is
// pinned at the top of the page, the settings scroll underneath it, and the buttons come last; on a computer
// (where the box is wider) the preview sits beside the settings, with the buttons at the bottom of it.
// The Goals tab has no preview: on a computer its pane is left empty (so every tab looks alike), and on a phone
// there's no pane at all.
function WithPreview({ preview, buttons, children }: { preview?: ReactNode; buttons: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-3 sm:flex-row-reverse sm:gap-5">
      {/* On a computer the pane runs down the box's right edge, from the banner to the bottom, with a
          line on its left. */}
      <div
        className={`${preview ? '' : 'hidden'} sticky top-0 z-10 -mx-4 -mt-4 border-b bg-pane px-4 pt-3 pb-3 sm:static sm:-my-4 sm:mr-[-1rem] sm:ml-0 sm:flex sm:w-64 sm:shrink-0 sm:flex-col sm:gap-3 sm:border-b-0 sm:border-l sm:p-3`}
      >
        {preview}
        {/* The buttons, pushed to the bottom of the pane (computer only). */}
        <div className="mt-auto hidden sm:block">{buttons}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {children}
        {/* The buttons, at the bottom of the box under the settings (phone only). */}
        <div className="mt-auto sm:hidden">{buttons}</div>
      </div>
    </div>
  )
}

// The name box shared by every New tab, with its character counter.
function NameField({
  id,
  value,
  onChange,
  error,
}: {
  id: string
  value: string
  onChange: (name: string) => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          Name
        </label>
        {/* How many characters are used, out of the limit. */}
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {value.length}/{MAX_GOAL_NAME}
        </span>
      </div>
      <input
        id={id}
        maxLength={MAX_GOAL_NAME}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={field}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {/* A short bar under the name, setting it apart from the goal's other settings. */}
      <hr aria-hidden="true" className="mx-auto mt-3 w-[90%] rounded-full border-t-2 border-foreground/20" />
    </div>
  )
}

// A small labelled box (unit, min, labels…), with room for an error underneath.
function SmallField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: (props: { id: string; className: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        className: field,
        ...(error ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {}),
      })}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

// Cancel and the main button, at the bottom of every page.
function Buttons({ onClose, label, disabled }: { onClose: () => void; label: string; disabled?: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" className={corners} onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" className={corners} disabled={disabled}>
        {label}
      </Button>
    </div>
  )
}

function NewToggle({ onClose, onCreate }: { onClose: () => void; onCreate: (goal: NewGoal) => void }) {
  const [name, setName] = useState('')
  const [mark, setMark] = useState<ToggleMark>('✓')
  const [error, setError] = useState<string>()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Give the goal a name.')
    onCreate({ name: trimmed, kind: 'toggle', mark })
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <WithPreview
        preview={<TogglePreview name={name} mark={mark} />}
        buttons={<Buttons onClose={onClose} label="New" />}
      >
        <NameField
          id="goal-name"
          value={name}
          onChange={(value) => {
            setName(value)
            setError(undefined)
          }}
          error={error}
        />
        {/* "Show as": the mark a done day gets in the grid. */}
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Show as</legend>
          <div className="flex gap-2">
            {(
              [
                ['✓', 'Check'],
                ['✗', 'Cross'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`${corners} flex flex-1 cursor-pointer items-center justify-center gap-2 border px-2 py-1.5 text-sm select-none ${mark === value ? 'border-primary bg-accent font-semibold' : 'hover:bg-accent/60'}`}
              >
                <input
                  type="radio"
                  name="toggle-mark"
                  value={value}
                  checked={mark === value}
                  onChange={() => setMark(value)}
                  className="sr-only"
                />
                <span className="text-lg font-bold" aria-hidden="true">
                  {value}
                </span>
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </WithPreview>
    </form>
  )
}

// Empty box = not set; otherwise the number in it (NaN if it isn't one).
// (On the New number and New choice pages, any change clears the error messages until New is pressed again.)
const parse = (text: string) => (text.trim() === '' ? undefined : Number(text))

function NewNumber({ onClose, onCreate }: { onClose: () => void; onCreate: (goal: NewGoal) => void }) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [min, setMin] = useState('0')
  const [max, setMax] = useState('')
  const [minLabel, setMinLabel] = useState('')
  const [maxLabel, setMaxLabel] = useState('')
  const [step, setStep] = useState<NumberSettings['step']>(1)
  const [show, setShow] = useState<NonNullable<NumberSettings['show']>>('entry')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // End labels, and the slider, only make sense once both ends are set.
  const bounded = min.trim() !== '' && max.trim() !== ''
  // The settings so far, for the preview (null while they don't make sense, e.g. max below min).
  const previewSettings: NumberSettings | null = (() => {
    const lo = parse(min)
    const hi = parse(max)
    if ((lo !== undefined && Number.isNaN(lo)) || (hi !== undefined && Number.isNaN(hi))) return null
    if (lo !== undefined && hi !== undefined && lo >= hi) return null
    return {
      unit: unit.trim() || undefined,
      min: lo,
      max: hi,
      minLabel: bounded ? minLabel.trim() || undefined : undefined,
      maxLabel: bounded ? maxLabel.trim() || undefined : undefined,
      step,
      show,
    }
  })()

  // Changing min or max: if that leaves an end empty, a slider falls back to the number box.
  const changeEnd = (which: 'min' | 'max', text: string) => {
    if (which === 'min') setMin(text)
    else setMax(text)
    const stillBounded = (which === 'min' ? text : min).trim() !== '' && (which === 'max' ? text : max).trim() !== ''
    if (!stillBounded && show === 'slider') setShow('entry')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    const lo = parse(min)
    const hi = parse(max)
    if (!name.trim()) found.name = 'Give the goal a name.'
    if (lo !== undefined && Number.isNaN(lo)) found.min = 'Not a number.'
    if (hi !== undefined && Number.isNaN(hi)) found.max = 'Not a number.'
    if (lo !== undefined && hi !== undefined && !found.min && !found.max && lo >= hi)
      found.max = 'Must be more than the min.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onCreate({
      name: name.trim(),
      kind: 'number',
      number: {
        unit: unit.trim() || undefined,
        min: lo,
        max: hi,
        minLabel: bounded ? minLabel.trim() || undefined : undefined,
        maxLabel: bounded ? maxLabel.trim() || undefined : undefined,
        step,
        show,
      },
    })
    onClose()
  }

  return (
    <form onSubmit={submit} onChange={() => setErrors({})} noValidate className="flex flex-1 flex-col">
      <WithPreview
        buttons={<Buttons onClose={onClose} label="New" />}
        preview={
          // Restarts when the bounds, step or style change, so it starts where a new day would.
          <NumberPreview
            key={previewSettings ? `${previewSettings.min}|${previewSettings.max}|${step}|${show}` : 'none'}
            name={name}
            settings={previewSettings}
          />
        }
      >
        <NameField id="number-name" value={name} onChange={setName} error={errors.name} />
        <SmallField id="number-unit" label="Unit (optional)">
          {(props) => (
            <input
              {...props}
              placeholder="pages, km…"
              maxLength={MAX_SHORT_TEXT}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          )}
        </SmallField>
        <div className="flex gap-2">
          <SmallField id="number-min" label="Min" error={errors.min}>
            {(props) => (
              <input {...props} inputMode="decimal" value={min} onChange={(e) => changeEnd('min', e.target.value)} />
            )}
          </SmallField>
          <SmallField id="number-max" label="Max" error={errors.max}>
            {(props) => (
              <input
                {...props}
                inputMode="decimal"
                placeholder="none"
                value={max}
                onChange={(e) => changeEnd('max', e.target.value)}
              />
            )}
          </SmallField>
        </div>
        {bounded && (
          <div className="flex gap-2">
            <SmallField id="number-min-label" label="Min means">
              {(props) => (
                <input
                  {...props}
                  placeholder="Awful"
                  maxLength={MAX_SHORT_TEXT}
                  value={minLabel}
                  onChange={(e) => setMinLabel(e.target.value)}
                />
              )}
            </SmallField>
            <SmallField id="number-max-label" label="Max means">
              {(props) => (
                <input
                  {...props}
                  placeholder="Great"
                  maxLength={MAX_SHORT_TEXT}
                  value={maxLabel}
                  onChange={(e) => setMaxLabel(e.target.value)}
                />
              )}
            </SmallField>
          </div>
        )}
        <SmallField id="number-step" label="Record in">
          {(props) => (
            <select {...props} value={step} onChange={(e) => setStep(Number(e.target.value) as NumberSettings['step'])}>
              <option value={1}>Whole numbers</option>
              <option value={0.5}>Halves (0.5)</option>
              <option value={0.1}>Tenths (0.1)</option>
            </select>
          )}
        </SmallField>
        {/* "Show as": how it's recorded. The slider needs both a min and a max. */}
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Show as</legend>
          <div className="flex gap-2">
            {(
              [
                ['entry', 'Number box'],
                ['dial', 'Dial'],
                ['slider', 'Slider'],
              ] as const
            ).map(([value, label]) => {
              const unavailable = value === 'slider' && !bounded
              return (
                <label
                  key={value}
                  className={`${corners} flex flex-1 flex-col items-center justify-center border px-2 py-1.5 text-center text-sm select-none ${unavailable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${show === value ? 'border-primary bg-accent font-semibold' : unavailable ? '' : 'hover:bg-accent/60'}`}
                >
                  <input
                    type="radio"
                    name="number-show"
                    value={value}
                    checked={show === value}
                    disabled={unavailable}
                    onChange={() => setShow(value)}
                    className="sr-only"
                  />
                  {label}
                  {unavailable && <span className="text-[11px] font-normal">needs a min and max</span>}
                </label>
              )
            })}
          </div>
        </fieldset>
      </WithPreview>
    </form>
  )
}

type DraftOption = { key: number; emoji: string; name: string }

function NewChoice({ onClose, onCreate }: { onClose: () => void; onCreate: (goal: NewGoal) => void }) {
  const [name, setName] = useState('')
  // Two empty options to start with; `key` keeps each box tied to its option as they're moved around.
  const [options, setOptions] = useState<DraftOption[]>([
    { key: 1, emoji: '', name: '' },
    { key: 2, emoji: '', name: '' },
  ])
  const [show, setShow] = useState<NonNullable<ChoiceSettings['show']>>('buttons')
  const list = useRef<HTMLDivElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const change = (key: number, changes: Partial<DraftOption>) => {
    setOptions((all) => all.map((o) => (o.key === key ? { ...o, ...changes } : o)))
    setErrors({})
  }
  // Typing (or pasting) an emoji into the name box makes it the option's emoji; the rest stays the name.
  const typeName = (key: number, text: string) => {
    const typed = firstEmoji(text)
    if (typed) change(key, { emoji: typed, name: text.replace(typed, '').trimStart() })
    else change(key, { name: text })
  }
  const move = (index: number, step: number) =>
    setOptions((all) => {
      const next = [...all]
      ;[next[index], next[index + step]] = [next[index + step], next[index]]
      return next
    })
  const addOption = () => {
    const key = Math.max(0, ...options.map((o) => o.key)) + 1
    setOptions((all) => [...all, { key, emoji: '', name: '' }])
    // Scroll the list down to the new option once it's there.
    requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    // Options left completely empty are ignored.
    const filled = options.filter((o) => o.emoji || o.name.trim())
    const emojis = filled.map((o) => o.emoji)
    if (!name.trim()) found.name = 'Give the goal a name.'
    if (filled.length < 2) found.options = 'Give it at least two options.'
    else if (filled.some((o) => !o.emoji)) found.options = 'Pick an emoji for every option.'
    else if (new Set(emojis).size !== emojis.length) found.options = 'Each option needs a different emoji.'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onCreate({
      name: name.trim(),
      kind: 'choice',
      choice: { options: filled.map((o) => ({ emoji: o.emoji, name: o.name.trim() || undefined })), show },
    })
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <WithPreview
        buttons={<Buttons onClose={onClose} label="New" />}
        preview={
          <ChoicePreview
            name={name}
            options={options.filter((o) => o.emoji).map((o) => ({ emoji: o.emoji, name: o.name.trim() || undefined }))}
            show={show}
          />
        }
      >
        <NameField
          id="choice-name"
          value={name}
          onChange={(value) => {
            setName(value)
            setErrors({})
          }}
          error={errors.name}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Options</legend>
          {/* The options scroll inside their own box (about four rows tall), so adding more doesn't make the
              whole add-a-goal box taller. The plus below stays put. */}
          <div ref={list} className="-m-1 flex max-h-[11.25rem] flex-col gap-1.5 overflow-y-auto p-1">
            {options.map((option, index) => (
              <div key={option.key} className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  {/* The option's emoji (what the grid will show). Tapping it pops up the emoji picker. */}
                  <EmojiPicker
                    value={option.emoji}
                    onPick={(emoji) => change(option.key, { emoji })}
                    label={
                      option.emoji
                        ? `Option ${index + 1} emoji: ${option.emoji}`
                        : `Pick an emoji for option ${index + 1}`
                    }
                    hint={option.name}
                  />
                  <input
                    aria-label={`Option ${index + 1} name (optional)`}
                    placeholder="name (optional)"
                    maxLength={MAX_OPTION}
                    value={option.name}
                    onChange={(e) => typeName(option.key, e.target.value)}
                    className={`${field} min-w-0 flex-1 py-1!`}
                  />
                  <button
                    type="button"
                    aria-label={`Move option ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowUp aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move option ${index + 1} down`}
                    disabled={index === options.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ArrowDown aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove option ${index + 1}`}
                    disabled={options.length <= 2}
                    onClick={() => setOptions((all) => all.filter((o) => o.key !== option.key))}
                    className="rounded-sm p-0.5 text-muted-foreground hover:bg-destructive hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* A plus, like the one for adding goals to the grid, lined up under the emoji boxes. */}
          <button
            type="button"
            aria-label="Add option"
            onClick={addOption}
            className="flex size-9 items-center justify-center self-start rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus aria-hidden="true" className="size-5" />
          </button>
          {errors.options && <p className="text-sm text-destructive">{errors.options}</p>}
        </fieldset>
        {/* "Show as": how a day is recorded. */}
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Show as</legend>
          <div className="flex gap-2">
            {(
              [
                ['buttons', 'Buttons'],
                ['dropdown', 'Dropdown'],
                ['wheel', 'Wheel'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`${corners} flex flex-1 cursor-pointer items-center justify-center border px-1 py-1.5 text-sm select-none ${show === value ? 'border-primary bg-accent font-semibold' : 'hover:bg-accent/60'}`}
              >
                <input
                  type="radio"
                  name="choice-show"
                  value={value}
                  checked={show === value}
                  onChange={() => setShow(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </WithPreview>
    </form>
  )
}
