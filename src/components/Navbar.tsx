import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-ink text-paper px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded">Getfetti</Link>
      <button
        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-paper focus:outline-none focus:ring-2 focus:ring-primary rounded"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
      </button>
      <div className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:relative top-full left-0 right-0 md:top-auto bg-ink md:bg-transparent p-6 md:p-0 gap-4 md:gap-6 md:items-center`}>
        {user ? (
          <>
            <Link to="/dashboard" className="text-paper hover:text-primary transition-colors font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded">My Events</Link>
            <span className="text-dim text-sm hidden md:block">{user.email}</span>
            <button onClick={handleLogout} className="bg-primary text-ink font-mono font-medium px-5 py-2 rounded-full hover:bg-primary-dark transition-colors min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-primary">Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-paper hover:text-primary transition-colors font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary rounded">Log in</Link>
            <Link to="/signup" className="bg-primary text-ink font-mono font-medium px-5 py-2 rounded-full hover:bg-primary-dark transition-colors min-h-[44px] text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-primary">Host an event</Link>
          </>
        )}
      </div>
    </nav>
  )
}
