import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user,     setUser]     = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setMenuOpen(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav
      className="sticky top-0 z-50 bg-ink border-b border-white/8 px-6"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          to="/"
          className="font-serif text-2xl font-bold text-primary tracking-tight focus-visible:outline-none hover:text-primary/85 transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          Getfetti
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden w-11 h-11 flex items-center justify-center text-paper rounded-xl hover:bg-white/8 transition-colors focus-visible:outline-none"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="font-mono text-lg leading-none select-none" aria-hidden="true">
            {menuOpen ? '✕' : '☰'}
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="font-mono text-sm text-paper/75 hover:text-paper transition-colors focus-visible:outline-none"
              >
                My Events
              </Link>
              <span className="font-mono text-xs text-dim hidden lg:block truncate max-w-[180px]">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="font-mono text-sm font-medium text-ink bg-primary px-5 py-2 rounded-full min-h-[38px] hover:bg-primary-dark transition-all duration-150 focus-visible:outline-none"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-mono text-sm text-paper/75 hover:text-paper transition-colors focus-visible:outline-none"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="font-mono text-sm font-semibold text-ink bg-primary px-5 py-2.5 rounded-full min-h-[40px] flex items-center hover:bg-primary-dark transition-all duration-150 focus-visible:outline-none shadow-sm"
              >
                Host an event
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/8 py-5 flex flex-col gap-3 animate-slide-dn">
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="font-mono text-sm text-paper/80 hover:text-paper py-2 focus-visible:outline-none"
              >
                My Events
              </Link>
              <p className="font-mono text-xs text-dim truncate">{user.email}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="self-start font-mono text-sm font-medium text-ink bg-primary px-6 py-2.5 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-150 mt-2"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="font-mono text-sm text-paper/80 hover:text-paper py-2 focus-visible:outline-none"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="self-start font-mono text-sm font-semibold text-ink bg-primary px-6 py-3 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-150"
              >
                Host an event
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
