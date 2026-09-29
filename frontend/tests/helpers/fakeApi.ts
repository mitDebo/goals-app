import { vi } from 'vitest'

// A pretend backend: answers /api/hello and /api/me like the real one would.
export function stubApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/api/hello') return new Response('hello, goals', { status: 200 })
    if (url === '/api/me' && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { timeZone: string }
      return Response.json({ timeZone: body.timeZone, weekStart: 'sunday', today: '2026-09-29' }, { status: 201 })
    }
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// The calls made to one API path, as [url, init] pairs.
export const callsTo = (fetchMock: ReturnType<typeof stubApi>, path: string) =>
  fetchMock.mock.calls.filter(([input]) => String(input) === path)
