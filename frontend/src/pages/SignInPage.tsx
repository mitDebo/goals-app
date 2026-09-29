import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { authCallbackUrl } from '@/auth/context'
import { supabase } from '@/auth/supabase'

const providers = [
  { id: 'google', label: 'Google' },
  { id: 'discord', label: 'Discord' },
  { id: 'twitch', label: 'Twitch' },
] as const

// The front door: three sign-in buttons and a magic-link email box. No passwords.
export function SignInPage() {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWith(provider: (typeof providers)[number]['id']) {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authCallbackUrl() },
    })
    if (error) setError(error.message)
  }

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authCallbackUrl() },
    })
    if (error) setError(error.message)
    else setEmailSent(true)
  }

  return (
    <section className="flex max-w-sm flex-col gap-3">
      {providers.map((provider) => (
        <Button key={provider.id} variant="outline" onClick={() => signInWith(provider.id)}>
          Continue with {provider.label}
        </Button>
      ))}

      <form onSubmit={sendMagicLink} className="mt-4 flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border px-3 py-2"
        />
        <Button type="submit">Email me a sign-in link</Button>
      </form>

      {emailSent && <p>Check your email for a sign-in link.</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
