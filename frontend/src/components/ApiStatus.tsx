import { useEffect, useState } from 'react'

type HelloState = { status: 'loading' } | { status: 'ok'; message: string } | { status: 'error' }

// Small status line: asks the backend's public /api/hello and shows the answer.
export function ApiStatus() {
  const [hello, setHello] = useState<HelloState>({ status: 'loading' })

  useEffect(() => {
    let ignore = false

    async function loadHello() {
      try {
        const response = await fetch('/api/hello')
        if (!response.ok) throw new Error(`Server answered ${response.status}`)
        const message = await response.text()
        if (!ignore) setHello({ status: 'ok', message })
      } catch {
        if (!ignore) setHello({ status: 'error' })
      }
    }

    loadHello()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <footer className="mt-8 text-sm text-muted-foreground">
      {hello.status === 'loading' && <p>Loading…</p>}
      {hello.status === 'ok' && <p>{hello.message}</p>}
      {hello.status === 'error' && (
        <p role="alert" className="text-destructive">
          Couldn't reach the server. Please try again later.
        </p>
      )}
    </footer>
  )
}
