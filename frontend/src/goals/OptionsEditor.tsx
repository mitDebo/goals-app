import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FieldErrors } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/Field'
import { moveItem } from '@/goals/optionRules'

// Each option carries a key that never changes, so React (and the drag library) can tell
// options apart even while they're being moved or edited.
// `id` is set for options that already exist on the server.
export type EditableOption = { key: number; id?: string; label: string; note: string; isTarget: boolean }

type Props = {
  options: EditableOption[]
  onChange: (options: EditableOption[]) => void
  onAdd: () => void
  errors: FieldErrors
}

const inputClass = 'rounded-md border bg-background px-2 py-1'

// The list of options for a pick-one goal: type them, add/remove them, and put them in order
// by dragging the handle or with the Move up / Move down buttons.
export function OptionsEditor({ options, onChange, onAdd, errors }: Props) {
  const sensors = useSensors(
    // Wait for a small movement before starting a drag, so a tap on the handle isn't a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const move = (from: number, to: number) => onChange(moveItem(options, from, to))
  const update = (key: number, changes: Partial<EditableOption>) =>
    onChange(options.map((o) => (o.key === key ? { ...o, ...changes } : o)))

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    move(
      options.findIndex((o) => o.key === active.id),
      options.findIndex((o) => o.key === over.id),
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={options.map((o) => o.key)} strategy={verticalListSortingStrategy}>
          {options.map((option, i) => (
            <OptionRow
              key={option.key}
              option={option}
              index={i}
              count={options.length}
              labelErrors={errors[`enum.options[${i}].label`]}
              noteErrors={errors[`enum.options[${i}].note`]}
              onLabel={(label) => update(option.key, { label })}
              onNote={(note) => update(option.key, { note })}
              onIsTarget={(isTarget) => update(option.key, { isTarget })}
              onMoveUp={() => move(i, i - 1)}
              onMoveDown={() => move(i, i + 1)}
              onRemove={() => onChange(options.filter((o) => o.key !== option.key))}
            />
          ))}
        </SortableContext>
      </DndContext>

      {(errors['enum.options'] ?? errors.enum)?.length ? (
        <p className="text-sm text-destructive">{(errors['enum.options'] ?? errors.enum).join(' ')}</p>
      ) : null}

      <Button type="button" variant="outline" className="self-start" onClick={onAdd}>
        Add option
      </Button>
    </div>
  )
}

function OptionRow(props: {
  option: EditableOption
  index: number
  count: number
  labelErrors?: string[]
  noteErrors?: string[]
  onLabel: (label: string) => void
  onNote: (note: string) => void
  onIsTarget: (isTarget: boolean) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  const { option, index, count } = props
  const n = index + 1
  // useSortable tells this row where to draw itself while something is being dragged.
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: option.key,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-md border bg-background p-2 ${isDragging ? 'z-10 shadow-md' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`Drag option ${n}`}
        className="mt-7 cursor-grab touch-none px-1 text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <div className="flex flex-1 flex-col gap-2">
        <Field id={`goal-option-${option.key}`} label={`Option ${n}`} errors={props.labelErrors}>
          {(fieldProps) => (
            <input {...fieldProps} className={inputClass} value={option.label} onChange={(e) => props.onLabel(e.target.value)} />
          )}
        </Field>
        <Field id={`goal-option-note-${option.key}`} label={`Note for option ${n} (optional)`} errors={props.noteErrors}>
          {(fieldProps) => (
            <input {...fieldProps} className={inputClass} value={option.note} onChange={(e) => props.onNote(e.target.value)} />
          )}
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            aria-label={`Option ${n} counts as a hit`}
            checked={option.isTarget}
            onChange={(e) => props.onIsTarget(e.target.checked)}
          />
          Counts as a hit
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <Button type="button" variant="outline" size="sm" aria-label={`Move option ${n} up`} disabled={index === 0} onClick={props.onMoveUp}>
          ↑
        </Button>
        <Button type="button" variant="outline" size="sm" aria-label={`Move option ${n} down`} disabled={index === count - 1} onClick={props.onMoveDown}>
          ↓
        </Button>
        {count > 2 && (
          <Button type="button" variant="outline" size="sm" aria-label={`Remove option ${n}`} onClick={props.onRemove}>
            ✕
          </Button>
        )}
      </div>
    </div>
  )
}
