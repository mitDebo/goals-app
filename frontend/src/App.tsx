import { useEffect, useState } from 'react'

// Walking-skeleton page: asks the backend for its hello message and shows it.
type HelloState =
  | { status: 'loading' }
  | { status: 'ok'; message: string }
  | { status: 'error' }

function App() {
  const [hello, setHello] = useState<HelloState>({ status: 'loading' })

  useEffect(() => {
    // If the page goes away before the answer arrives, ignore the answer.
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
    <main className="p-6 text-lg">
      {hello.status === 'loading' && <p>Loading…</p>}
      {hello.status === 'ok' && <p>{hello.message}</p>}
      {hello.status === 'error' && (
        <p role="alert" className="text-destructive">
          Couldn't reach the server. Please try again later.
        </p>
      )}
    </main>
  )
}

export default App
