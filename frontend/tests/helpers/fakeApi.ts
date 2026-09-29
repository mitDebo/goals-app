import { vi } from 'vitest'

export type FakeProfile = { timeZone: string; weekStart: 'sunday' | 'monday' }

type Options = {
  // The profile the backend already has for this user (null = none yet).
  profile?: FakeProfile | null
  // Force PATCH /api/me to fail with this validation error.
  rejectPatchWith?: { field: string; message: string }
}

// A pretend backend: answers /api/hello and /api/me like the real one would,
// and remembers the profile between calls.
export function stubApi({ profile = null, rejectPatchWith }: Options = {}) {
  let current: FakeProfile | null = profile
  const withToday = (p: FakeProfile) => ({ ...p, today: '2026-09-29' })

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'

    if (url === '/api/hello') return new Response('hello, goals', { status: 200 })

    if (url === '/api/me' && method === 'GET') {
      return current ? Response.json(withToday(current)) : new Response(null, { status: 404 })
    }

    if (url === '/api/me' && method === 'POST') {
      if (current) return Response.json(withToday(current), { status: 200 })
      const body = JSON.parse(String(init?.body)) as { timeZone: string }
      current = { timeZone: body.timeZone, weekStart: 'sunday' }
      return Response.json(withToday(current), { status: 201 })
    }

    if (url === '/api/me' && method === 'PATCH') {
      if (!current) return new Response(null, { status: 404 })
      if (rejectPatchWith) {
        return Response.json(
          { title: 'One or more validation errors occurred.', status: 400, errors: { [rejectPatchWith.field]: [rejectPatchWith.message] } },
          { status: 400 },
        )
      }
      const body = JSON.parse(String(init?.body)) as Partial<FakeProfile>
      current = { ...current, ...body }
      return Response.json(withToday(current))
    }

    return new Response(null, { status: 404 })
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// The calls made to one API path (optionally one method), as [url, init] pairs.
export const callsTo = (fetchMock: ReturnType<typeof stubApi>, path: string, method?: string) =>
  fetchMock.mock.calls.filter(
    ([input, init]) => String(input) === path && (method === undefined || (init?.method ?? 'GET') === method),
  )
