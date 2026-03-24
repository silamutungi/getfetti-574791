import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type Event, type Rsvp, type HostBrief } from '../types/index'

const MAYBE_LABELS: Record<string, string> = {
  schedule_conflict: 'Schedule conflict',
  waiting_plus_one:  'Waiting on plus-one',
  arriving_late:     'Arriving late',
  need_more_info:    'Needs more info',
}

const EVENT_TYPE_EMOJI: Record<string, string> = {
  birthday:     '🎂',
  dinner:       '🍽',
  rooftop:      '🌇',
  housewarming: '🏠',
  general:      '✨',
}

function buildBrief(rsvps: Rsvp[]): HostBrief {
  const yes    = rsvps.filter(r => r.status === 'yes')
  const no     = rsvps.filter(r => r.status === 'no')
  const maybes = rsvps.filter(r => r.status === 'maybe')
  return {
    total_yes:         yes.length,
    total_no:          no.length,
    total_maybe:       maybes.length,
    unresolved_maybes: maybes,
    pending_plus_ones: rsvps.filter(r => r.plus_one && r.status === 'maybe'),
    likely_attendance: yes.length + Math.round(maybes.length * 0.5),
  }
}

type GuestFilter = 'all' | 'yes' | 'maybe' | 'no'

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="bg-white/7 rounded-2xl p-5 text-center">
      <p className={`font-serif text-4xl font-bold ${accent ? 'text-primary' : 'text-paper'}`}>
        {value}
      </p>
      <p className="font-mono text-xs text-dim mt-1">{label}</p>
    </div>
  )
}

export default function EventDetail() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const [event,  setEvent]  = useState<Event | null>(null)
  const [rsvps,  setRsvps]  = useState<Rsvp[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]  = useState('')
  const [filter,  setFilter] = useState<GuestFilter>('all')
  const [copied,  setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const { data: ev, error: evErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .is('deleted_at', null)
        .single()

      if (evErr || !ev) {
        setError('Event not found or you do not have access.')
        setLoading(false)
        return
      }
      setEvent(ev)

      const { data: rs } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      setRsvps(rs ?? [])
      setLoading(false)
    }
    void load()
  }, [id, navigate])

  const copyLink = async () => {
    if (!event) return
    await navigator.clipboard.writeText(`${window.location.origin}/rsvp/${event.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  // ── Loading ────────────────────────────────────────────

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
      <div className="skeleton h-5 w-24 mb-6" />
      <div className="skeleton h-10 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-56 w-full rounded-3xl mt-8" />
    </div>
  )

  if (error || !event) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center">
      <span className="text-4xl" aria-hidden="true">🔍</span>
      <p className="font-mono text-sm text-dim">{error || 'Event not found.'}</p>
      <Link
        to="/dashboard"
        className="bg-primary text-ink font-mono font-semibold px-7 py-3 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-200"
      >
        Back to dashboard
      </Link>
    </div>
  )

  const brief         = buildBrief(rsvps)
  const filteredRsvps = filter === 'all' ? rsvps : rsvps.filter(r => r.status === filter)
  const typeEmoji     = EVENT_TYPE_EMOJI[event.event_type] ?? '✨'

  const actions = [
    brief.pending_plus_ones.length > 0
      ? `${brief.pending_plus_ones.length} plus-one ${brief.pending_plus_ones.length === 1 ? 'request needs' : 'requests need'} approval`
      : null,
    brief.unresolved_maybes.length > 0
      ? `${brief.unresolved_maybes.length} ${brief.unresolved_maybes.length === 1 ? 'maybe' : 'maybes'} to follow up with`
      : null,
    brief.likely_attendance < 5
      ? 'Share the invite link to get more RSVPs'
      : null,
  ].filter((x): x is string => x !== null)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Back + header */}
      <div className="mb-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 font-mono text-sm text-dim hover:text-ink transition-colors mb-5 focus-visible:outline-none"
        >
          <span aria-hidden="true">&larr;</span> My Events
        </Link>

        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-dim mb-2">
              {typeEmoji} {event.event_type}
            </p>
            <h1
              className="font-serif font-bold text-ink mb-2 leading-tight"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.02em' }}
            >
              {event.title}
            </h1>
            <p className="font-mono text-sm text-dim">
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
              {' · '}{event.location}
            </p>
          </div>

          <button
            type="button"
            onClick={() => { void copyLink() }}
            className={`
              font-mono font-semibold text-sm px-6 py-3 rounded-full min-h-[44px]
              transition-all duration-200 shrink-0 active:scale-[0.97] focus-visible:outline-none
              ${copied
                ? 'bg-primary text-ink'
                : 'bg-ink text-primary hover:bg-ink/80'
              }
            `}
          >
            {copied ? 'Link copied!' : 'Copy invite link'}
          </button>
        </div>
      </div>

      {/* Host Brief */}
      <div className="bg-ink rounded-3xl p-7 md:p-8 mb-10">
        <div className="flex items-baseline justify-between gap-4 mb-7">
          <h2 className="font-serif text-2xl font-bold text-primary">Host Brief</h2>
          <span className="font-mono text-xs text-dim">
            {rsvps.length} {rsvps.length === 1 ? 'response' : 'responses'} total
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={brief.likely_attendance} label="Likely attending" accent />
          <StatCard value={brief.total_yes}         label="Confirmed yes" />
          <StatCard value={brief.total_maybe}       label="Maybe" />
          <StatCard value={brief.total_no}          label="Cannot make it" />
        </div>

        {actions.length > 0 ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-dim mb-3">
              Things to handle
            </p>
            <div className="flex flex-col gap-2">
              {actions.map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/7 rounded-xl px-5 py-3.5">
                  <span className="font-serif text-lg font-bold text-primary leading-none flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-mono text-sm text-paper">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ) : rsvps.length === 0 ? (
          <div className="flex items-center gap-3 bg-white/7 rounded-xl px-5 py-4">
            <span className="text-2xl" aria-hidden="true">📬</span>
            <p className="font-mono text-sm text-dim">No RSVPs yet. Share the link to get responses.</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-primary/12 rounded-xl px-5 py-4">
            <span className="text-2xl" aria-hidden="true">🎉</span>
            <p className="font-mono text-sm text-primary">All clear. Nothing urgent to handle.</p>
          </div>
        )}
      </div>

      {/* Guest list */}
      <div>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="font-serif text-2xl font-bold text-ink">
            Guest list
          </h2>
          <div className="flex gap-2 flex-wrap">
            {([
              ['all',   `All (${rsvps.length})`],
              ['yes',   `Yes (${brief.total_yes})`],
              ['maybe', `Maybe (${brief.total_maybe})`],
              ['no',    `No (${brief.total_no})`],
            ] as [GuestFilter, string][]).map(([f, label]) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`
                  px-4 py-2 rounded-full font-mono text-xs font-medium transition-all duration-150
                  min-h-[36px] focus-visible:outline-none
                  ${filter === f
                    ? 'bg-ink text-primary'
                    : 'bg-surface text-dim hover:bg-surface-2 hover:text-ink border border-border'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredRsvps.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
            <p className="font-mono text-sm text-dim">
              {rsvps.length === 0 ? 'No responses yet.' : 'No guests in this category.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRsvps.map(r => (
              <div
                key={r.id}
                className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-ink truncate">{r.guest_name}</p>
                  <p className="font-mono text-xs text-dim truncate">{r.guest_email}</p>
                  {r.maybe_reason && (
                    <p className="font-mono text-xs text-primary-dark mt-1">
                      {MAYBE_LABELS[r.maybe_reason]}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {r.plus_one && (
                    <span className="font-mono text-xs text-dim bg-surface px-2.5 py-1 rounded-full border border-border">
                      +1
                    </span>
                  )}
                  <span className={`
                    font-mono text-xs px-3 py-1 rounded-full
                    ${r.status === 'yes'
                      ? 'bg-primary/20 text-primary-dark'
                      : r.status === 'maybe'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-600 border border-red-100'
                    }
                  `}>
                    {r.status === 'yes' ? 'Going' : r.status === 'maybe' ? 'Maybe' : 'Not going'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
