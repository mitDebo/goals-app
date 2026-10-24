import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ALL_EMOJI, firstEmoji, suggestEmoji } from '@/week/emoji'

const corners = 'rounded-[5px]'
const PANEL_WIDTH = 288 // px: eight emoji across, plus padding
const GAP = 4 // px between the button and the panel

type Props = {
  value: string
  onPick: (emoji: string) => void
  // What the button is called for screen readers ("Option 1 emoji").
  label: string
  // Words to suggest emoji for (the option's name), shown at the top of the panel.
  hint: string
}

// An emoji button that works like a "react" button in a chat app. Tap it and a panel of emoji pops up
// just under it (above it if there's no room below). Tap an emoji to pick it, and the panel closes. Tap
// the button again, tap anywhere else, or press Esc, and it closes without changing anything.
export function EmojiPicker({ value, onPick, label, hint }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState<{ left: number; top: number } | null>(null)

  const close = () => {
    setOpen(false)
    setSearch('')
  }
  const pick = (emoji: string) => {
    onPick(emoji)
    close()
    button.current?.focus()
  }

  // Work out where the panel goes, and keep it there if the page scrolls or the window changes size.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const at = button.current?.getBoundingClientRect()
      const height = panel.current?.offsetHeight ?? 0
      if (!at) return
      const left = Math.min(Math.max(8, at.left), window.innerWidth - PANEL_WIDTH - 8)
      const below = at.bottom + GAP
      const top = below + height > window.innerHeight - 8 ? Math.max(8, at.top - GAP - height) : below
      setSpot({ left, top })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  // Close when tapping outside the panel (the button handles its own taps), or on Esc. Esc is caught
  // first so it only closes the panel, not the whole add-a-goal box.
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panel.current?.contains(target) && !button.current?.contains(target)) close()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      close()
      button.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape, true)
    }
  }, [open])

  // What's in the panel. While searching: the matches (and the emoji itself, if one was typed or pasted).
  // Otherwise: suggestions for the option's name (if it has one), then everything.
  const typed = firstEmoji(search)
  const sections: [string, string[]][] = search.trim()
    ? [['Results', [...new Set([...(typed ? [typed] : []), ...suggestEmoji(search, ALL_EMOJI.length)])]]]
    : [
        ...(hint.trim() ? ([['Suggested', suggestEmoji(hint, 8)]] as [string, string[]][]) : []),
        ['All', ALL_EMOJI],
      ]

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className={`${corners} flex size-9 shrink-0 items-center justify-center border text-xl ${value ? 'border-gray-300 bg-white' : 'border-dashed border-muted-foreground/60 text-sm text-muted-foreground'} ${open ? 'ring-2 ring-ring' : ''}`}
      >
        {value || '☺︎'}
      </button>
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label="Pick an emoji"
          style={{ width: PANEL_WIDTH, left: spot?.left ?? 0, top: spot?.top ?? 0, visibility: spot ? 'visible' : 'hidden' }}
          className="fixed z-50 flex flex-col gap-1 rounded-lg border bg-popover p-2 text-popover-foreground shadow-xl"
        >
          <input
            // Straight into the search box with a mouse; on a phone that would pop the keyboard up, so not there.
            autoFocus={window.matchMedia('(pointer: fine)').matches}
            aria-label="Search emoji"
            placeholder="Search, or paste any emoji"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              // Enter picks the first result instead of sending the form.
              if (e.key !== 'Enter') return
              e.preventDefault()
              const first = sections[0]?.[1][0]
              if (first) pick(first)
            }}
            className={`${corners} w-full border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 [color-scheme:light]`}
          />
          <div className="max-h-56 overflow-y-auto">
            {sections.map(([title, emojis]) => (
              <div key={title}>
                <p className="px-1 pt-1 text-[11px] font-medium text-muted-foreground italic">{title}</p>
                <div className="grid grid-cols-8">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={emoji}
                      aria-pressed={value === emoji}
                      onClick={() => pick(emoji)}
                      className={`flex size-8 items-center justify-center rounded-md text-xl hover:bg-accent ${value === emoji ? 'bg-accent ring-1 ring-ring' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {sections.every(([, emojis]) => emojis.length === 0) && (
              <p className="px-1 py-2 text-xs text-muted-foreground">No matches. Paste any emoji to use it.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
