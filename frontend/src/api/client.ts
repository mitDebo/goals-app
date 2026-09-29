// Calls our own backend, showing the sign-in token so the backend knows who we are.
export async function apiFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  return fetch(path, { ...init, headers })
}
