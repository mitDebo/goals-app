// Calls our own backend, showing the sign-in token so the backend knows who we are.
export async function apiFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  return fetch(path, { ...init, headers })
}

// Field name → messages, from a 400 response in ASP.NET's ValidationProblem shape
// ({ errors: { "name": ["A name is required."] } }). Empty if the body isn't one.
export type FieldErrors = Record<string, string[]>

export async function readFieldErrors(res: Response): Promise<FieldErrors> {
  const problem = (await res.json().catch(() => null)) as { errors?: FieldErrors } | null
  return problem?.errors ?? {}
}
