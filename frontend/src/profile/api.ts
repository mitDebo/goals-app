import { apiFetch } from '@/api/client'

export type WeekStart = 'sunday' | 'monday'
export type Profile = { timeZone: string; weekStart: WeekStart; today: string }

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// Creates the profile on first visit; returns the existing one otherwise.
// Returns null if it couldn't be done (server error or no connection).
export async function ensureProfile(token: string): Promise<Profile | null> {
  try {
    const res = await apiFetch('/api/me', token, {
      method: 'POST',
      body: JSON.stringify({ timeZone: browserTimeZone() }),
    })
    return res.ok ? ((await res.json()) as Profile) : null
  } catch {
    return null
  }
}

export async function getProfile(token: string): Promise<Profile | null> {
  const res = await apiFetch('/api/me', token)
  return res.ok ? ((await res.json()) as Profile) : null
}

export type SaveResult = { ok: true; profile: Profile } | { ok: false; errors: string[] }

// Sends only the fields given. On a 400, returns the server's reasons.
export async function updateProfile(
  token: string,
  changes: Partial<Pick<Profile, 'timeZone' | 'weekStart'>>,
): Promise<SaveResult> {
  const res = await apiFetch('/api/me', token, { method: 'PATCH', body: JSON.stringify(changes) })
  if (res.ok) return { ok: true, profile: (await res.json()) as Profile }

  const problem = (await res.json().catch(() => null)) as { errors?: Record<string, string[]> } | null
  const errors = Object.values(problem?.errors ?? {}).flat()
  return { ok: false, errors: errors.length ? errors : ["Couldn't save your settings."] }
}
