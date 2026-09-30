import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import type { FieldErrors } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/Field'
import { createGoal, type Goal, type GoalDraft } from '@/goals/api'

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
  range: (key) => key.startsWith('range'),
  number: (key) => key.startsWith('number'),
  enum: (key) => key.startsWith('enum'),
}

const inputClass = 'rounded-md border bg-background px-2 py-1'

// Each option gets a key that never changes, so React keeps the right text in the right box
// when an option above it is removed.
type Option = { key: number; label: string }

export function NewGoalPage({ session }: { session: Session }) {
  const navigate = useNavigate()
  const nextKey = useRef(2)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<Kind>('boolean')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [unit, setUnit] = useState('')
  const [options, setOptions] = useState<Option[]>([
    { key: 0, label: '' },
    { key: 1, label: '' },
  ])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  // Only what the chosen kind uses is sent; blank optional boxes are left out.
  const buildDraft = (): GoalDraft => {
    const draft: GoalDraft = { name, type: kind }
    if (description.trim()) draft.description = description
    if (kind === 'range') draft.range = { min: toNumber(min), max: toNumber(max) }
    if (kind === 'number') draft.number = unit.trim() ? { unit } : {}
    if (kind === 'enum') draft.enum = { ordered: false, options: options.map((o) => ({ label: o.label })) }
    return draft
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const result = await createGoal(session.access_token, buildDraft())
    setSaving(false)
    if (result.ok) navigate('/goals')
    else setErrors(result.errors)
  }

  const addOption = () => setOptions([...options, { key: nextKey.current++, label: '' }])
  const removeOption = (key: number) => setOptions(options.filter((o) => o.key !== key))
  const setOptionLabel = (key: number, label: string) =>
    setOptions(options.map((o) => (o.key === key ? { ...o, label } : o)))

  const shownHere = (key: string) => key === 'name' || key === 'description' || fieldKeys[kind](key)
  const otherErrors = Object.entries(errors)
    .filter(([key]) => !shownHere(key))
    .flatMap(([, messages]) => messages)

  return (
    <section className="flex flex-col items-start gap-4">
      <h2 className="text-xl font-semibold">New goal</h2>

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

        <fieldset className="flex flex-col gap-1">
          <legend>Kind of goal</legend>
          {kinds.map((k) => (
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
            {options.map((option, i) => (
              <div key={option.key} className="flex items-end gap-2">
                <Field id={`goal-option-${option.key}`} label={`Option ${i + 1}`} errors={errors[`enum.options[${i}].label`]}>
                  {(props) => (
                    <input
                      {...props}
                      className={inputClass}
                      value={option.label}
                      onChange={(e) => setOptionLabel(option.key, e.target.value)}
                    />
                  )}
                </Field>
                {options.length > 2 && (
                  <Button type="button" variant="outline" aria-label={`Remove option ${i + 1}`} onClick={() => removeOption(option.key)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <GroupErrors errors={errors['enum.options'] ?? errors.enum} />
            <Button type="button" variant="outline" className="self-start" onClick={addOption}>
              Add option
            </Button>
          </div>
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

// A number box's text as a number, or undefined when it's empty (so it's left out of the JSON).
const toNumber = (text: string) => (text.trim() === '' ? undefined : Number(text))
