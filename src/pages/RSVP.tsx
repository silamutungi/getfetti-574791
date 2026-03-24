import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type Event } from '../types/index'

type ViewMode = 'vibe' | 'simple'
type RsvpStatus = 'yes' | 'no' | 'maybe'
type MaybeReason = 'schedule_conflict' | 'waiting_plus_one' | 'arriving_late' | 'need_more_info'

const MAYBE_REASONS: { value: MaybeReason; label: string; emoji: string }[] = [
  { value: 'schedule_conflict', label: 'Schedule conflict', emoji: '📅' },
  { value: 'waiting_plus_one', label: 'Waiting on my plus-one', emoji: '👫' },
  { value: 'arriving_late', label: 'I might arrive late', emoji: '🕐' },
  { value: 'need_more_info', label: 'Need more info', emoji: '🤔' },
]

export default function RSVP() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('vibe')
  const [step, setStep] = useState<'rsvp' | 'maybe' | 'done'>('rsvp')
  const [form, setForm] = useState({ name: '', email: '', status: '' as RsvpStatus | '', plusOne: false })
  const [maybeReason, setMaybeReason] = useState<MaybeReason | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()
      .then(({ data, error: dbErr }) => {
        if (dbErr || !data) { setNotFound(true); setLoading(false); return }
        setEvent(data)
        setLoading(false)
      })
  }, [slug])

  const handleRsvp = async () => {
    setError('')
    if (!form.name.trim()) { setError('Please enter your name.'); return }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email.'); return }
    if (!form.status) { setError('Please select your RSVP.'); return }
    if (form.status === 'maybe') { setStep('maybe'); return }
    await submit(null)
  }

  const submit = async (reason: MaybeReason | null) => {
    setSubmitting(true)
    const { error: insertErr } = await supabase.from('rsvps').insert({
      event_id: event!.id,
      guest_name: form.name.trim(),
      guest_email: form.email.trim().toLowerCase(),
      status: form.status,
      maybe_reason: reason,
      plus_one: form.plusOne,
    })
    setSubmitting(false)
    if (insertErr) { setError('Something went wrong. Please try again.'); return }
    setStep('done')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-label="Loading" />
    </div>
  )

  if (notFound || !event) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <h1 className="font-serif text-4xl text-ink">Event not found</h1>
      <p className="text-dim font-mono text-sm">This link may have expired or been removed.</p>
      <a href="/" className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full min-h-[44px] hover:bg-primary-dark">Back to Getfetti</a>
    </div>
  )

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const formattedTime = new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const isVibe = viewMode === 'vibe'

  if (step === 'done') return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-16 ${isVibe ? 'bg-ink' : 'bg-paper'}`}>
      <div className="w-full max-w-md text-center">
        <p className="text-5xl mb-6">{form.status === 'yes' ? '🎉' : form.status === 'maybe' ? '🤔' : '💌'}</p>
        <h1 className={`font-serif text-4xl font-bold mb-4 ${isVibe ? 'text-primary' : 'text-ink'}`}>
          {form.status === 'yes' ? "You're in!" : form.status === 'maybe' ? "Got it — maybe!" : "Got your RSVP"}
        </h1>
        <p className={`font-mono text-sm mb-8 ${isVibe ? 'text-dim' : 'text-dim'}`}>
          {form.status === 'yes'
            ? `See you at ${event.title} on ${formattedDate}.`
            : form.status === 'maybe'
            ? "We'll keep your spot warm. Let us know if anything changes."
            : "Thanks for letting us know. We hope to see you next time."}
        </p>
        <a href="/" className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full min-h-[44px] hover:bg-primary-dark inline-block">Host your own event</a>
      </div>
    </div>
  )

  if (step === 'maybe') return (
    <div className={`min-h-screen px-6 py-16 ${isVibe ? 'bg-ink' : 'bg-paper'}`}>
      <div className="max-w-md mx-auto">
        <h2 className={`font-serif text-3xl font-bold mb-2 ${isVibe ? 'text-primary' : 'text-ink'}`}>What is holding you back?</h2>
        <p className={`font-mono text-sm mb-8 ${isVibe ? 'text-dim' : 'text-dim'}`}>Help the host understand your maybe — it only takes a second.</p>
        <div className="flex flex-col gap-3 mb-8">
          {MAYBE_REASONS.map(r => (
            <button
              key={r.value}
              onClick={() => setMaybeReason(r.value)}
              className={`text-left px-5 py-4 rounded-2xl border-2 font-mono text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary min-h-[52px] ${
                maybeReason === r.value
                  ? 'border-primary bg-primary/10 text-ink'
                  : isVibe
                  ? 'border-paper/20 text-paper hover:border-primary'
                  : 'border-ink/20 text-ink hover:border-primary'
              }`}
            >
              <span className="mr-3">{r.emoji}</span>{r.label}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="text-red-400 font-mono text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => { void submit(maybeReason) }}
            disabled={submitting}
            className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full min-h-[44px] hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Send my maybe'}
          </button>
          <button
            onClick={() => { void submit(null) }}
            disabled={submitting}
            className={`font-mono text-sm px-4 py-3 rounded-full min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary ${isVibe ? 'text-dim hover:text-paper' : 'text-dim hover:text-ink'}`}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${isVibe ? 'bg-ink' : 'bg-paper'}`}>
      <div className="flex justify-center pt-8 pb-2">
        <div className={`flex rounded-full p-1 gap-1 ${isVibe ? 'bg-paper/10' : 'bg-ink/10'}`}>
          <button
            onClick={() => setViewMode('vibe')}
            className={`px-4 py-2 rounded-full font-mono text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary ${viewMode === 'vibe' ? 'bg-primary text-ink' : isVibe ? 'text-dim' : 'text-dim'}`}
          >
            Vibe View
          </button>
          <button
            onClick={() => setViewMode('simple')}
            className={`px-4 py-2 rounded-full font-mono text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary ${viewMode === 'simple' ? 'bg-primary text-ink' : isVibe ? 'text-dim' : 'text-dim'}`}
          >
            Simple View
          </button>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <p className={`font-mono text-xs uppercase tracking-widest mb-2 ${isVibe ? 'text-primary' : 'text-primary-dark'}`}>{event.event_type}</p>
          <h1 className={`font-serif text-5xl font-bold mb-4 ${isVibe ? 'text-primary' : 'text-ink'}`}>{event.title}</h1>
          <p className={`font-mono text-sm mb-1 ${isVibe ? 'text-paper' : 'text-ink'}`}>{isVibe ? '📅 ' : ''}{formattedDate} at {formattedTime}</p>
          <p className={`font-mono text-sm mb-4 ${isVibe ? 'text-paper' : 'text-ink'}`}>{isVibe ? '📍 ' : ''}{event.location}</p>
          {event.description && <p className="text-dim font-mono text-sm leading-relaxed">{event.description}</p>}
        </div>
        <div className={`rounded-3xl p-8 ${isVibe ? 'bg-paper/10' : 'bg-white border border-ink/10'}`}>
          <h2 className={`font-serif text-2xl font-bold mb-6 ${isVibe ? 'text-primary' : 'text-ink'}`}>
            {isVibe ? "Will you be there?" : "RSVP"}
          </h2>
          <div className="flex flex-col gap-5">
            <div>
              <label htmlFor="rsvp-name" className={`block font-mono text-sm mb-2 ${isVibe ? 'text-paper' : 'text-ink'}`}>Your name</label>
              <input
                id="rsvp-name" type="text" maxLength={100}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-ink/20 bg-white rounded-xl px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="rsvp-email" className={`block font-mono text-sm mb-2 ${isVibe ? 'text-paper' : 'text-ink'}`}>Email</label>
              <input
                id="rsvp-email" type="email" maxLength={254}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-ink/20 bg-white rounded-xl px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <p className={`font-mono text-sm mb-3 ${isVibe ? 'text-paper' : 'text-ink'}`}>{isVibe ? "Are you coming?" : "Attending?"}</p>
              <div className="flex gap-3">
                {(['yes', 'no', 'maybe'] as RsvpStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={`flex-1 py-3 rounded-full font-mono text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] ${
                      form.status === s
                        ? 'bg-primary text-ink'
                        : isVibe
                        ? 'bg-paper/10 text-paper hover:bg-paper/20 border border-paper/20'
                        : 'bg-ink/5 text-ink hover:bg-ink/10 border border-ink/20'
                    }`}
                  >
                    {s === 'yes' ? (isVibe ? 'Yes!' : 'Yes') : s === 'no' ? "No" : 'Maybe'}
                  </button>
                ))}
              </div>
            </div>
            {event.plus_one_rule !== 'none' && (
              <label className={`flex items-center gap-3 font-mono text-sm cursor-pointer ${isVibe ? 'text-paper' : 'text-ink'}`}>
                <input
                  type="checkbox"
                  checked={form.plusOne}
                  onChange={e => setForm(f => ({ ...f, plusOne: e.target.checked }))}
                  className="w-5 h-5 rounded focus:ring-2 focus:ring-primary accent-primary"
                />
                {event.plus_one_rule === 'ask' ? 'I want to bring a plus-one (host will confirm)' : 'Bringing a plus-one'}
              </label>
            )}
            {error && <p role="alert" className="text-red-500 font-mono text-sm">{error}</p>}
            <button
              onClick={() => { void handleRsvp() }}
              disabled={submitting}
              className="bg-primary text-ink font-mono font-medium px-6 py-4 rounded-full min-h-[52px] hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark disabled:opacity-60 text-base"
            >
              {submitting ? 'Sending...' : isVibe ? "Send my RSVP" : "Submit RSVP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
