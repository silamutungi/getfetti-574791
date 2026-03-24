import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type Event } from '../types/index'
import Confetti from '../components/Confetti'

type ViewMode    = 'vibe' | 'simple'
type RsvpStatus  = 'yes' | 'no' | 'maybe'
type MaybeReason = 'schedule_conflict' | 'waiting_plus_one' | 'arriving_late' | 'need_more_info'

const MAYBE_REASONS: { value: MaybeReason; label: string; emoji: string; hint: string }[] = [
  { value: 'schedule_conflict', label: 'Schedule conflict',        emoji: '📅', hint: 'I have something else on' },
  { value: 'waiting_plus_one',  label: 'Waiting on my plus-one',   emoji: '👫', hint: 'Need to confirm who is coming with me' },
  { value: 'arriving_late',     label: 'I might arrive late',      emoji: '🕐', hint: 'I can make part of it' },
  { value: 'need_more_info',    label: 'Need more info',           emoji: '🤔', hint: 'I have some questions first' },
]

const EVENT_TYPE_EMOJI: Record<string, string> = {
  birthday: '🎂',
  dinner: '🍽',
  rooftop: '🌇',
  housewarming: '🏠',
  general: '✨',
}

function StatusButton({ status, current, vibe, onClick }: {
  status: RsvpStatus
  current: RsvpStatus | ''
  vibe: boolean
  onClick: () => void
}) {
  const active = current === status
  const label  = status === 'yes' ? (vibe ? 'Yes!' : 'Yes') : status === 'no' ? 'No' : 'Maybe'
  const emoji  = status === 'yes' ? '🎉' : status === 'no' ? '😔' : '🤔'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl font-mono text-sm font-medium
        transition-all duration-150 focus-visible:outline-none min-h-[60px]
        ${active
          ? 'bg-primary text-ink shadow-sm scale-[1.02]'
          : vibe
          ? 'bg-white/8 text-white/80 border border-white/15 hover:bg-white/15 hover:border-white/30'
          : 'bg-surface text-ink border border-border hover:bg-surface-2 hover:border-border'
        }
      `}
    >
      <span className="text-xl leading-none">{emoji}</span>
      {label}
    </button>
  )
}

export default function RSVP() {
  const { slug } = useParams<{ slug: string }>()
  const [event,      setEvent]      = useState<Event | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [viewMode,   setViewMode]   = useState<ViewMode>('vibe')
  const [step,       setStep]       = useState<'rsvp' | 'maybe' | 'done'>('rsvp')
  const [form,       setForm]       = useState({ name: '', email: '', status: '' as RsvpStatus | '', plusOne: false })
  const [maybeReason, setMaybeReason] = useState<MaybeReason | null>(null)
  const [submitting, setSubmitting]  = useState(false)
  const [error,      setError]       = useState('')
  const [confetti,   setConfetti]    = useState(false)

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
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (!form.status) { setError('Please choose your RSVP.'); return }
    if (form.status === 'maybe') { setStep('maybe'); return }
    await submit(null)
  }

  const submit = async (reason: MaybeReason | null) => {
    setSubmitting(true)
    const { error: insertErr } = await supabase.from('rsvps').insert({
      event_id:     event!.id,
      guest_name:   form.name.trim(),
      guest_email:  form.email.trim().toLowerCase(),
      status:       form.status,
      maybe_reason: reason,
      plus_one:     form.plusOne,
    })
    setSubmitting(false)
    if (insertErr) { setError('Something went wrong. Please try again.'); return }
    if (form.status === 'yes') setConfetti(true)
    setStep('done')
  }

  const isVibe = viewMode === 'vibe'

  // ── Loading ────────────────────────────────────────────

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isVibe ? 'bg-ink' : 'bg-paper'}`}>
      <div className="w-9 h-9 rounded-full border-[3px] border-primary border-t-transparent animate-spin-sm" aria-label="Loading event" />
    </div>
  )

  if (notFound || !event) return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="text-5xl select-none" aria-hidden="true">💌</span>
      <h1 className="font-serif text-4xl font-bold text-ink">Event not found</h1>
      <p className="font-mono text-sm text-dim max-w-xs leading-relaxed">
        This invite link may have expired or been removed.
      </p>
      <a
        href="/"
        className="bg-primary text-ink font-mono font-semibold px-8 py-3 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-200 inline-flex items-center"
      >
        Back to Getfetti
      </a>
    </div>
  )

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const formattedTime = new Date(event.date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
  const typeEmoji = EVENT_TYPE_EMOJI[event.event_type] ?? '✨'

  // ── Done ───────────────────────────────────────────────

  if (step === 'done') return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-16 ${isVibe ? 'bg-ink' : 'bg-paper'}`}>
      <Confetti active={confetti} />
      <div className="w-full max-w-md text-center animate-fade-up">
        <div
          className="text-6xl mb-6 select-none"
          aria-hidden="true"
          style={confetti ? { animation: 'heartbeat 0.65s ease' } : undefined}
        >
          {form.status === 'yes' ? '🎉' : form.status === 'maybe' ? '🤔' : '💌'}
        </div>

        <h1 className={`font-serif font-bold mb-4 ${isVibe ? 'text-primary' : 'text-ink'}`}
          style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}
        >
          {form.status === 'yes' ? "You're in!" : form.status === 'maybe' ? "Got it — maybe!" : "Got your RSVP"}
        </h1>

        <p className="font-mono text-sm text-dim mb-3 leading-relaxed">
          {form.status === 'yes'
            ? `See you at ${event.title} on ${formattedDate}.`
            : form.status === 'maybe'
            ? "We'll keep your spot warm. The host knows where you stand."
            : "Thanks for letting us know. Hope to see you next time."}
        </p>

        {form.status === 'yes' && (
          <p className={`font-mono text-xs mb-8 ${isVibe ? 'text-dim' : 'text-dim'}`}>
            {event.location} &middot; {formattedTime}
          </p>
        )}

        <div className={`rounded-2xl px-6 py-5 mb-8 text-left ${isVibe ? 'bg-white/8 border border-white/12' : 'bg-surface border border-border'}`}>
          <p className={`font-mono text-xs uppercase tracking-widest mb-3 ${isVibe ? 'text-dim' : 'text-dim'}`}>
            {typeEmoji} {event.title}
          </p>
          <p className={`font-mono text-sm ${isVibe ? 'text-white/80' : 'text-ink'}`}>
            {formattedDate} at {formattedTime}
          </p>
          <p className={`font-mono text-sm ${isVibe ? 'text-dim' : 'text-dim'}`}>{event.location}</p>
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-ink font-mono font-semibold px-7 py-3 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-200 text-sm"
        >
          Host your own event
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  )

  // ── Maybe reason ────────────────────────────────────────

  if (step === 'maybe') return (
    <div className={`min-h-screen px-6 py-12 ${isVibe ? 'bg-ink' : 'bg-paper'}`}>
      <div className="max-w-md mx-auto animate-fade-up">
        <button
          type="button"
          onClick={() => setStep('rsvp')}
          className={`font-mono text-sm mb-8 flex items-center gap-2 transition-colors ${isVibe ? 'text-dim hover:text-white' : 'text-dim hover:text-ink'}`}
        >
          <span aria-hidden="true">&larr;</span> Back
        </button>

        <h2 className={`font-serif font-bold mb-2 ${isVibe ? 'text-primary' : 'text-ink'}`}
          style={{ fontSize: 'clamp(1.7rem, 5vw, 2.4rem)' }}
        >
          What is holding you back?
        </h2>
        <p className="font-mono text-sm text-dim mb-8 leading-relaxed">
          Pick the reason that fits. It helps the host plan — and only takes a second.
        </p>

        <div className="flex flex-col gap-3 mb-8">
          {MAYBE_REASONS.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setMaybeReason(r.value)}
              className={`
                text-left px-5 py-4 rounded-2xl border-2 transition-all duration-150
                focus-visible:outline-none min-h-[64px]
                ${maybeReason === r.value
                  ? 'border-primary bg-primary/12 shadow-sm'
                  : isVibe
                  ? 'border-white/15 hover:border-white/35 hover:bg-white/5'
                  : 'border-border hover:border-ink/30 hover:bg-surface'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{r.emoji}</span>
                <div>
                  <p className={`font-mono text-sm font-medium ${maybeReason === r.value ? 'text-ink' : isVibe ? 'text-white' : 'text-ink'}`}>
                    {r.label}
                  </p>
                  <p className="font-mono text-xs text-dim mt-0.5">{r.hint}</p>
                </div>
                {maybeReason === r.value && (
                  <span className="ml-auto text-primary-dark font-mono text-base leading-none flex-shrink-0 mt-0.5">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {error && <p role="alert" className="font-mono text-sm text-red-400 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { void submit(maybeReason) }}
            disabled={submitting}
            className="bg-primary text-ink font-mono font-semibold px-8 py-3 rounded-full min-h-[48px] hover:bg-primary-dark transition-all duration-200 disabled:opacity-60 active:scale-[0.97]"
          >
            {submitting ? 'Sending...' : 'Send my maybe'}
          </button>
          <button
            type="button"
            onClick={() => { void submit(null) }}
            disabled={submitting}
            className={`font-mono text-sm px-5 py-3 rounded-full min-h-[48px] transition-colors disabled:opacity-60 ${isVibe ? 'text-dim hover:text-white' : 'text-dim hover:text-ink'}`}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )

  // ── RSVP form ───────────────────────────────────────────

  return (
    <div className={`min-h-screen ${isVibe ? 'bg-ink' : 'bg-paper'}`}>

      {/* View toggle */}
      <div className="flex justify-center pt-8 pb-2 px-6">
        <div className={`inline-flex rounded-full p-1 gap-1 ${isVibe ? 'bg-white/10' : 'bg-ink/8'}`}>
          {(['vibe', 'simple'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`
                px-5 py-2 rounded-full font-mono text-xs font-medium transition-all duration-200
                focus-visible:outline-none min-h-[36px]
                ${viewMode === mode
                  ? 'bg-primary text-ink shadow-sm'
                  : isVibe ? 'text-dim hover:text-white' : 'text-dim hover:text-ink'
                }
              `}
            >
              {mode === 'vibe' ? 'Vibe View' : 'Simple View'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Event header */}
        <div className="mb-10 animate-fade-up">
          <p className={`font-mono text-xs uppercase tracking-widest mb-3 ${isVibe ? 'text-primary' : 'text-primary-dark'}`}>
            {typeEmoji} {event.event_type}
          </p>
          <h1
            className={`font-serif font-bold mb-4 ${isVibe ? 'text-primary' : 'text-ink'}`}
            style={{ fontSize: 'clamp(2.2rem, 8vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            {event.title}
          </h1>
          <div className={`flex flex-col gap-1 font-mono text-sm mb-4 ${isVibe ? 'text-white/80' : 'text-ink'}`}>
            <span>{formattedDate} at {formattedTime}</span>
            <span>{event.location}</span>
          </div>
          {event.description && (
            <p className="font-mono text-sm text-dim leading-relaxed border-t border-white/10 pt-4 mt-4">
              {event.description}
            </p>
          )}
        </div>

        {/* RSVP card */}
        <div
          className={`rounded-3xl p-7 animate-fade-up delay-100 ${isVibe ? 'bg-white/8 border border-white/12' : 'bg-white border border-border shadow-sm'}`}
        >
          <h2 className={`font-serif text-2xl font-bold mb-6 ${isVibe ? 'text-primary' : 'text-ink'}`}>
            {isVibe ? "Will you be there?" : "RSVP"}
          </h2>

          <div className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label
                htmlFor="rsvp-name"
                className={`block font-mono text-xs uppercase tracking-widest mb-2 ${isVibe ? 'text-dim' : 'text-dim'}`}
              >
                Your name
              </label>
              <input
                id="rsvp-name"
                type="text"
                maxLength={100}
                autoComplete="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={`
                  w-full rounded-xl px-4 py-3 font-mono text-sm text-ink focus:outline-none
                  min-h-[48px] transition-all duration-150
                  ${isVibe
                    ? 'bg-white text-ink border border-white/20 focus:ring-2 focus:ring-primary'
                    : 'bg-surface border border-border focus:ring-2 focus:ring-primary'
                  }
                `}
                placeholder="Your name"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="rsvp-email"
                className={`block font-mono text-xs uppercase tracking-widest mb-2 ${isVibe ? 'text-dim' : 'text-dim'}`}
              >
                Email address
              </label>
              <input
                id="rsvp-email"
                type="email"
                maxLength={254}
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={`
                  w-full rounded-xl px-4 py-3 font-mono text-sm text-ink focus:outline-none
                  min-h-[48px] transition-all duration-150
                  ${isVibe
                    ? 'bg-white text-ink border border-white/20 focus:ring-2 focus:ring-primary'
                    : 'bg-surface border border-border focus:ring-2 focus:ring-primary'
                  }
                `}
                placeholder="you@example.com"
              />
            </div>

            {/* Status */}
            <div>
              <p className={`font-mono text-xs uppercase tracking-widest mb-3 ${isVibe ? 'text-dim' : 'text-dim'}`}>
                {isVibe ? "Are you coming?" : "Attending?"}
              </p>
              <div className="flex gap-3">
                {(['yes', 'no', 'maybe'] as RsvpStatus[]).map(s => (
                  <StatusButton
                    key={s}
                    status={s}
                    current={form.status}
                    vibe={isVibe}
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                  />
                ))}
              </div>
            </div>

            {/* Plus one */}
            {event.plus_one_rule !== 'none' && (
              <label className={`flex items-center gap-3 cursor-pointer font-mono text-sm select-none ${isVibe ? 'text-white/80' : 'text-ink'}`}>
                <input
                  type="checkbox"
                  checked={form.plusOne}
                  onChange={e => setForm(f => ({ ...f, plusOne: e.target.checked }))}
                  className="w-5 h-5 rounded accent-primary focus:ring-2 focus:ring-primary flex-shrink-0"
                />
                {event.plus_one_rule === 'ask'
                  ? "I want to bring a plus-one (host will confirm)"
                  : "Bringing a plus-one"}
              </label>
            )}

            {/* Error */}
            {error && (
              <p role="alert" className="font-mono text-sm text-red-500 animate-fade-in">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={() => { void handleRsvp() }}
              disabled={submitting}
              className="bg-primary text-ink font-mono font-semibold px-6 py-4 rounded-full min-h-[54px] hover:bg-primary-dark hover:text-white transition-all duration-200 disabled:opacity-60 text-base active:scale-[0.98]"
            >
              {submitting ? 'Sending...' : isVibe ? "Send my RSVP" : "Submit RSVP"}
            </button>
          </div>
        </div>

        {/* Getfetti credit */}
        <p className="font-mono text-xs text-dim text-center mt-8 opacity-60">
          Powered by <a href="/" className="hover:text-ink transition-colors">Getfetti</a>
        </p>
      </div>
    </div>
  )
}
