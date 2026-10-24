// The kinds of goal (mockup). Numbers cover both open-ended amounts and bounded scales (a range is just a
// number with a max); a choice is picking one of your own options. (Targets and "hits" are parked for now.)

export type NumberSettings = {
  unit?: string
  min?: number
  max?: number
  // Words for the two ends, only when both min and max are set ("Awful" … "Great").
  minLabel?: string
  maxLabel?: string
  // How finely it can be recorded: whole numbers, halves or tenths.
  step: 1 | 0.5 | 0.1
  // How it's recorded: a number box with − / +, a dial, or a slider (which needs both min and max).
  show?: 'entry' | 'dial' | 'slider'
}

// Each option is an emoji (what the grid shows), with an optional name. Listed in the order entered.
export type ChoiceSettings = {
  options: { emoji: string; name?: string }[]
  // How it's recorded: a stack of buttons, a dropdown, or a spinning wheel.
  show?: 'buttons' | 'dropdown' | 'wheel'
}

// The mark a toggle shows when done: a check, or a cross ("crossed off" — not "missed").
export type ToggleMark = '✓' | '✗'

export type NewGoal =
  | { name: string; kind: 'toggle'; mark?: ToggleMark }
  | { name: string; kind: 'number'; number: NumberSettings }
  | { name: string; kind: 'choice'; choice: ChoiceSettings }
