import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/auth/supabase'

// Google, Discord and Twitch hand Supabase a picture; email sign-ins don't, so those get a letter.
const pictureOf = (user: User): string | undefined => user.user_metadata?.avatar_url ?? user.user_metadata?.picture

const initialOf = (user: User) =>
  String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '?')
    .charAt(0)
    .toUpperCase()

const links = [
  { to: '/runs', label: 'Current runs' },
  { to: '/runs/past', label: 'Past runs' },
  { to: '/plans', label: 'Plans' },
  { to: '/goals', label: 'Goals' },
  { to: '/settings', label: 'Settings' },
]

// Your picture in the corner. Tap it and a little list drops down; tap anywhere else (or Esc) to close it.
export function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const [pictureFailed, setPictureFailed] = useState(false)
  const menu = useRef<HTMLDivElement>(null)
  const picture = pictureFailed ? undefined : pictureOf(user)

  useEffect(() => {
    if (!open) return
    const closeIfOutside = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeIfOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={menu} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground ring-offset-2 hover:ring-2 hover:ring-ring"
      >
        {picture ? (
          // no-referrer: Google's picture links refuse requests that say which site they came from.
          <img src={picture} alt="" referrerPolicy="no-referrer" className="size-full object-cover" onError={() => setPictureFailed(true)} />
        ) : (
          <span className="text-lg font-semibold">{initialOf(user)}</span>
        )}
      </button>

      {open && (
        <nav
          aria-label="Account"
          className="absolute right-0 mt-2 flex w-48 flex-col rounded-md border bg-background py-1 text-base shadow-md"
        >
          {user.email && <p className="truncate px-3 py-2 text-sm text-muted-foreground">{user.email}</p>}
          {links.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="px-3 py-2 hover:bg-accent">
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              supabase.auth.signOut()
            }}
            className="border-t px-3 py-2 text-left hover:bg-accent"
          >
            Sign out
          </button>
        </nav>
      )}
    </div>
  )
}
