import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-paper">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl font-bold text-ink mb-2">Host your first event</h1>
        <p className="text-dim font-mono text-sm mb-8">Free to start. No credit card needed.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor="email" className="block font-mono text-sm text-ink mb-2">Email address</label>
            <input
              id="email" type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              maxLength={254}
              className="w-full border border-ink/20 bg-white rounded-xl px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-mono text-sm text-ink mb-2">Password</label>
            <input
              id="password" type="password" autoComplete="new-password" required
              value={password} onChange={e => setPassword(e.target.value)}
              maxLength={128}
              className="w-full border border-ink/20 bg-white rounded-xl px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 font-mono text-sm">
              {error}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full hover:bg-primary-dark transition-colors min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-dark disabled:opacity-60"
          >
            {loading ? <span className="w-5 h-5 rounded-full border-2 border-ink border-t-transparent animate-spin" aria-label="Creating account" /> : 'Create free account'}
          </button>
        </form>
        <p className="font-mono text-sm text-dim mt-6 text-center">
          Already hosting? <Link to="/login" className="text-ink underline hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary rounded">Log in</Link>
        </p>
        <p className="font-mono text-xs text-dim mt-4 text-center">
          By signing up you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
