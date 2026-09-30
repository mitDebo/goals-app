import { vi } from 'vitest'

export type FakeProfile = { timeZone: string; weekStart: 'sunday' | 'monday' }

// A goal as GET /api/goals returns it: only the block for its type is present.
export type FakeGoal = {
  id: string
  name: string
  description?: string
  type: 'boolean' | 'range' | 'number' | 'enum'
  displayStyle: string
  position: number
  range?: { min: number; max: number; minLabel?: string; maxLabel?: string }
  number?: { unit?: string }
  enum?: { ordered: boolean; options: { id: string; label: string; note?: string; isTarget: boolean }[] }
  target?: { comparison: 'at_least' | 'at_most'; value: number }
}

type Options = {
  // The profile the backend already has for this user (null = none yet).
  profile?: FakeProfile | null
  // Force PATCH /api/me to fail with this validation error.
  rejectPatchWith?: { field: string; message: string }
  // Make POST /api/me fail as if the server broke (500).
  failProfile?: boolean
  // The goals GET /api/goals returns, already in the server's order.
  goals?: FakeGoal[]
  // Make GET /api/goals fail as if the server broke (500).
  failGoals?: boolean
  // Make POST /api/goals fail with this validation error.
  rejectGoalWith?: { field: string; message: string }
}

// A pretend backend: answers /api/hello and /api/me like the real one would,
// and remembers the profile between calls.
export function stubApi({
  profile = null,
  rejectPatchWith,
  failProfile,
  goals = [],
  failGoals,
  rejectGoalWith,
}: Options = {}) {
  let current: FakeProfile | null = profile
  const savedGoals = [...goals]
  const withToday = (p: FakeProfile) => ({ ...p, today: '2026-09-29' })

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'

    if (url === '/api/hello') return new Response('hello, goals', { status: 200 })

    if (url === '/api/me' && method === 'GET') {
      return current ? Response.json(withToday(current)) : new Response(null, { status: 404 })
    }

    if (url === '/api/goals' && method === 'GET') {
      return failGoals ? new Response(null, { status: 500 }) : Response.json(savedGoals)
    }

    if (url === '/api/goals' && method === 'POST') {
      if (rejectGoalWith) return validationProblem(rejectGoalWith.field, rejectGoalWith.message)
      const body = JSON.parse(String(init?.body)) as Omit<FakeGoal, 'id' | 'position' | 'displayStyle'>
      const created: FakeGoal = { ...body, id: `new-${savedGoals.length + 1}`, position: savedGoals.length, displayStyle: 'toggle' }
      savedGoals.push(created)
      return Response.json(created, { status: 201 })
    }

    if (url === '/api/me' && method === 'POST') {
      if (failProfile) return new Response(null, { status: 500 })
      if (current) return Response.json(withToday(current), { status: 200 })
      const body = JSON.parse(String(init?.body)) as { timeZone: string }
      current = { timeZone: body.timeZone, weekStart: 'sunday' }
      return Response.json(withToday(current), { status: 201 })
    }

    if (url === '/api/me' && method === 'PATCH') {
      if (!current) return new Response(null, { status: 404 })
      if (rejectPatchWith) return validationProblem(rejectPatchWith.field, rejectPatchWith.message)
      const body = JSON.parse(String(init?.body)) as Partial<FakeProfile>
      current = { ...current, ...body }
      return Response.json(withToday(current))
    }

    return new Response(null, { status: 404 })
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// What the real server sends back for a 400 (ASP.NET's ValidationProblem shape).
const validationProblem = (field: string, message: string) =>
  Response.json(
    { title: 'One or more validation errors occurred.', status: 400, errors: { [field]: [message] } },
    { status: 400 },
  )

// The calls made to one API path (optionally one method), as [url, init] pairs.
export const callsTo = (fetchMock: ReturnType<typeof stubApi>, path: string, method?: string) =>
  fetchMock.mock.calls.filter(
    ([input, init]) => String(input) === path && (method === undefined || (init?.method ?? 'GET') === method),
  )
