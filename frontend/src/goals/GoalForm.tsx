import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { FieldErrors } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/Field'
import type { Goal, GoalDraft, SaveGoalResult } from '@/goals/api'
import { RangeControl } from '@/goals/controls/RangeControl'
import { checkOptions } from '@/goals/optionRules'
import { OptionsEditor, type EditableOption } from '@/goals/OptionsEditor'
import { checkRange, rangeStyles, suggestStyle, type RangeStyle } from '@/goals/rangeRules'

type Kind = Goal['type']

const kinds: { value: Kind; label: string }[] = [
  { value: 'boolean', label: 'Yes / no' },
  { value: 'range', label: 'Range' },
  { value: 'number', label: 'Number' },
  { value: 'enum', label: 'Pick one' },
]

// Error keys the form can show next to a box for each kind; any other error goes at the top.
const fieldKeys: Record<Kind, (key: string) => boolean> = {
  boolean: () => false,
  range: (key) => key.startsWith('range') || key.startsWith('target'),
  number: (key) => key.startsWith('number') || key.startsWith('target'),
  enum: (key) => key.startsWith('enum'),
}

type Comparison = 'at_least' | 'at_most'

// Prototype: new goals are yes/no only (see spec/prototype.md). The other kinds' code stays for later,
// and an existing goal of another kind keeps its kind when edited.
const prototypeKinds: Kind[] = ['boolean']

const inputClass = 'rounded-md border bg-background px-2 py-1'

type Props = {
  title: string
  // The goal being edited; leave out for a new goal.
  initial?: Goal
  save: (draft: GoalDraft) => Promise<SaveGoalResult>
}

// The form for a new goal and for editing one. Each box starts with the goal's current value
// (or empty for a new goal); Save hands the finished draft to `save`.
export function GoalForm({ title, initial, save: saveDraft }: Props) {
  const navigate = useNavigate()

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [kind, setKind] = useState<Kind>(initial?.type ?? 'boolean')
  const [min, setMin] = useState(String(initial?.range?.min ?? ''))
  const [max, setMax] = useState(String(initial?.range?.max ?? ''))
  const [minLabel, setMinLabel] = useState(initial?.range?.minLabel ?? '')
  const [maxLabel, setMaxLabel] = useState(initial?.range?.maxLabel ?? '')
  // null until you pick a style yourself; until then the form shows its suggestion.
  // An existing range goal's style counts as picked.
  const [pickedStyle, setPickedStyle] = useState<RangeStyle | null>(
    initial?.type === 'range' ? (initial.displayStyle as RangeStyle) : null,
  )
  const [previewValue, setPreviewValue] = useState<number | undefined>(undefined)
  const [unit, setUnit] = useState(initial?.number?.unit ?? '')
  const [options, setOptions] = useState<EditableOption[]>(
    initial?.enum?.options.map((o, i) => ({ key: i, id: o.id, label: o.label, note: o.note ?? '', isTarget: o.isTarget })) ?? [
      { key: 0, label: '', note: '', isTarget: false },
      { key: 1, label: '', note: '', isTarget: false },
    ],
  )
  const nextKey = useRef(options.length)
  const [ranked, setRanked] = useState(initial?.enum?.ordered ?? false)
  const [targetOn, setTargetOn] = useState(!!initial?.target)
  const [comparison, setComparison] = useState<Comparison>(initial?.target?.comparison ?? 'at_least')
  const [targetValue, setTargetValue] = useState(String(initial?.target?.value ?? ''))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const range = checkRange(min, max)
  const rangeIsValid = Object.keys(range.errors).length === 0
  const shownStyle = pickedStyle ?? (rangeIsValid ? suggestStyle(range.min!, range.max!) : null)

  // Only what the chosen kind uses is sent; blank optional boxes are left out.
  const buildDraft = (): GoalDraft => {
    const draft: GoalDraft = { name, type: kind }
    if (description.trim()) draft.description = description
    if (kind === 'range') {
      draft.range = { min: range.min, max: range.max }
      if (minLabel.trim()) draft.range.minLabel = minLabel
      if (maxLabel.trim()) draft.range.maxLabel = maxLabel
      // A suggested style is left to the server, which works out the same default.
      if (pickedStyle) draft.displayStyle = pickedStyle
    }
    if (kind === 'number') draft.number = unit.trim() ? { unit } : {}
    if ((kind === 'range' || kind === 'number') && targetOn) {
      draft.target = { comparison, value: Number(targetValue) }
    }
    if (kind === 'enum') {
      draft.enum = {
        ordered: ranked,
        // Existing options keep their id so the server updates them rather than replacing them.
        options: options.map((o) => ({
          ...(o.id ? { id: o.id } : {}),
          label: o.label,
          ...(o.note.trim() ? { note: o.note } : {}),
          ...(o.isTarget ? { isTarget: true } : {}),
        })),
      }
    }
    return draft
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    // Problems the form can spot itself are shown straight away, without asking the server.
    const formErrors =
      kind === 'range'
        ? { ...range.errors, ...targetErrors() }
        : kind === 'number'
          ? targetErrors()
          : kind === 'enum'
            ? checkOptions(options.map((o) => o.label))
            : {}
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    setSaving(true)
    const result = await saveDraft(buildDraft())
    setSaving(false)
    if (result.ok) navigate('/goals')
    else setErrors(result.errors)
  }

  // A turned-on target needs a value; a range target must also be a whole number inside the range.
  const targetErrors = (): FieldErrors => {
    if (!targetOn) return {}
    const text = targetValue.trim()
    const value = Number(text)
    const problem =
      text === ''
        ? 'A target value is required.'
        : Number.isNaN(value)
          ? 'Target must be a number.'
          : kind === 'range' && !Number.isInteger(value)
            ? 'A range target must be a whole number.'
            : kind === 'range' && rangeIsValid && (value < range.min! || value > range.max!)
              ? `Target must be between ${range.min} and ${range.max}.`
              : null
    return problem ? { 'target.value': [problem] } : {}
  }

  const addOption = () =>
    setOptions([...options, { key: nextKey.current++, label: '', note: '', isTarget: false }])

  const availableKinds = kinds.filter((k) => prototypeKinds.includes(k.value) || k.value === initial?.type)

  const shownHere = (key: string) => key === 'name' || key === 'description' || fieldKeys[kind](key)
  const otherErrors = Object.entries(errors)
    .filter(([key]) => !shownHere(key))
    .flatMap(([, messages]) => messages)

  return (
    <section className="flex flex-col items-start gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      {otherErrors.length > 0 && (
        <p role="alert" className="text-destructive">
          {otherErrors.join(' ')}
        </p>
      )}

      <form onSubmit={save} className="flex w-full max-w-md flex-col gap-4" noValidate>
        <Field id="goal-name" label="Name" errors={errors.name}>
          {(props) => (
            <input {...props} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          )}
        </Field>

        <Field id="goal-description" label="Description (optional)" errors={errors.description}>
          {(props) => (
            <textarea
              {...props}
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>

        {availableKinds.length > 1 && (
          <fieldset className="flex flex-col gap-1">
            <legend>Kind of goal</legend>
            {availableKinds.map((k) => (
              <label key={k.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kind"
                  value={k.value}
                  checked={kind === k.value}
                  onChange={() => setKind(k.value)}
                />
                {k.label}
              </label>
            ))}
          </fieldset>
        )}

        {kind === 'range' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Field id="goal-range-min" label="Minimum" errors={errors['range.min']}>
                {(props) => (
                  <input {...props} type="number" className={inputClass} value={min} onChange={(e) => setMin(e.target.value)} />
                )}
              </Field>
              <Field id="goal-range-max" label="Maximum" errors={errors['range.max']}>
                {(props) => (
                  <input {...props} type="number" className={inputClass} value={max} onChange={(e) => setMax(e.target.value)} />
                )}
              </Field>
            </div>
            <GroupErrors errors={errors.range} />

            <div className="flex gap-4">
              <Field id="goal-range-min-label" label="Label for the low end (optional)" errors={errors['range.minLabel']}>
                {(props) => (
                  <input {...props} className={inputClass} value={minLabel} onChange={(e) => setMinLabel(e.target.value)} />
                )}
              </Field>
              <Field id="goal-range-max-label" label="Label for the high end (optional)" errors={errors['range.maxLabel']}>
                {(props) => (
                  <input {...props} className={inputClass} value={maxLabel} onChange={(e) => setMaxLabel(e.target.value)} />
                )}
              </Field>
            </div>

            <fieldset className="flex flex-col gap-1">
              <legend>Display style</legend>
              {rangeStyles.map((s) => (
                <label key={s.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="display-style"
                    value={s.value}
                    checked={shownStyle === s.value}
                    onChange={() => setPickedStyle(s.value)}
                  />
                  {s.label}
                </label>
              ))}
            </fieldset>

            {rangeIsValid && shownStyle && (
              <section aria-label="Preview" className="flex flex-col gap-1 rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Preview</span>
                <div className="flex items-center gap-2">
                  {minLabel.trim() && <span className="text-sm">{minLabel}</span>}
                  <RangeControl
                    style={shownStyle}
                    min={range.min!}
                    max={range.max!}
                    value={previewValue}
                    onChange={setPreviewValue}
                  />
                  {maxLabel.trim() && <span className="text-sm">{maxLabel}</span>}
                </div>
              </section>
            )}
          </div>
        )}

        {kind === 'number' && (
          <Field id="goal-number-unit" label="Unit (optional)" errors={errors['number.unit']}>
            {(props) => (
              <input {...props} className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} />
            )}
          </Field>
        )}

        {kind === 'enum' && (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={ranked} onChange={(e) => setRanked(e.target.checked)} />
              Ranked (first is worst, last is best)
            </label>
            <OptionsEditor options={options} onChange={setOptions} onAdd={addOption} errors={errors} />
          </div>
        )}

        {(kind === 'range' || kind === 'number') && (
          <fieldset className="flex flex-col gap-2">
            <legend>Daily target</legend>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={targetOn} onChange={(e) => setTargetOn(e.target.checked)} />
              Set a daily target
            </label>
            {targetOn && (
              <div className="flex gap-4">
                <Field id="goal-target-comparison" label="Comparison" errors={errors['target.comparison']}>
                  {(props) => (
                    <select
                      {...props}
                      className={inputClass}
                      value={comparison}
                      onChange={(e) => setComparison(e.target.value as Comparison)}
                    >
                      <option value="at_least">At least</option>
                      <option value="at_most">At most</option>
                    </select>
                  )}
                </Field>
                <Field id="goal-target-value" label="Target value" errors={errors['target.value']}>
                  {(props) => (
                    <input
                      {...props}
                      type="number"
                      step="any"
                      className={inputClass}
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                    />
                  )}
                </Field>
              </div>
            )}
            <GroupErrors errors={errors.target} />
          </fieldset>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            Save
          </Button>
          <Link to="/goals" className="underline">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}

// Errors about a group of boxes rather than one box, e.g. "Minimum must be less than maximum."
function GroupErrors({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="text-sm text-destructive">{errors.join(' ')}</p> : null
}
