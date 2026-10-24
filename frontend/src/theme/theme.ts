import { useState } from 'react'

// Light or dark. The choice is remembered in this browser; until you pick one, we follow your computer's setting.
// Dark mode works by putting a "dark" label on the page; index.css swaps every color when it sees that label.
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function savedOrSystemTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage can be blocked (e.g. private windows); fall back to the system setting.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  // Also tells the browser, so its own bits (scrollbars, date pickers) match.
  document.documentElement.style.colorScheme = theme
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(savedOrSystemTheme)

  const setTheme = (next: Theme) => {
    apply(next)
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not remembered, but still applied for this visit.
    }
  }

  return { theme, setTheme }
}
