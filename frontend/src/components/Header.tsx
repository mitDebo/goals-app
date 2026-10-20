import { Link } from 'react-router'
import { useAuth } from '@/auth/context'
import { AccountMenu } from '@/components/AccountMenu'

// The bar across the top of every page. It stays put while the page scrolls underneath (sticky).
// Left: the site name, which goes home. Right: your picture (the menu) or a "Sign in" link.
export function Header() {
  const { session, loading } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur">
      <h1 className="text-2xl font-bold">
        <Link to="/">Goals</Link>
      </h1>
      {!loading &&
        (session ? (
          <AccountMenu user={session.user} />
        ) : (
          <Link to="/sign-in" className="underline">
            Sign in
          </Link>
        ))}
    </header>
  )
}
