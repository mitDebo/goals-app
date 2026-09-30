import type { ReactNode } from 'react'

// A labelled form control with room for an error message underneath. The message is linked
// to the control (aria-describedby), so screen readers read it out when you're on the box.
export function Field({
  id,
  label,
  errors,
  children,
}: {
  id: string
  label: string
  errors?: string[]
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode
}) {
  const errorId = `${id}-error`
  const hasErrors = !!errors?.length

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        ...(hasErrors ? { 'aria-invalid': true, 'aria-describedby': errorId } : {}),
      })}
      {hasErrors && (
        <p id={errorId} className="text-sm text-destructive">
          {errors.join(' ')}
        </p>
      )}
    </div>
  )
}
