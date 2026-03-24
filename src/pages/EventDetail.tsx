import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type Event, type Rsvp, type HostBrief } from '../types/index'

const MAYBE_LABELS: Record<string, string> = {
  schedule_conflict: 'Schedule conflict',
  waiting_plus_one: 'Waiting on plus-one',
  arriving_late: 'Arriving late',
  need_more_info: 'Needs more info',
}

function buildBrief(rsvps: Rsvp[]): HostBrief {
  const yes = rsvps.filter(r => r.status === 'yes')
  const no = rsvps.filter(r => r.status === 'no')
  const maybes = rsvps.filter(r => r.status === 'maybe')
  const pendingPlus = rsvps.filter(r => r.plus_one && r.status === 'maybe')
  return {
    total_yes: yes.length,
    total_no: no.length,
    total_maybe: maybes.length,
    unresolved_maybes: maybes,
    pending_plus_ones: pendingPlus,
    likely_attendance: yes.length + Math.round(maybes.length * 0.5),
  }
}

type GuestFilter = 'all' | 'yes' | 'maybe' | 'no'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<GuestFilter>('all')
  const [copied, setCopied] = useState(false)

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
      if (evErr || !ev) { setError('Event not found or you do not have access.'); setLoading(false); return }
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
    const url = `${window.location.origin}/rsvp/${event.slug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-label="Loading" />
    </div>
  )

  if (error || !event) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <p className="text-red-600 font-mono text-sm">{error || 'Event not found.'}</p>
      <Link to="/dashboard" className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full min-h-[44px] hover:bg-primary-dark">Back to dashboard</Link>
    </div>
  )

  const brief = buildBrief(rsvps)
  const filteredRsvps = filter === 'all' ? rsvps : rsvps.filter(r => r.status === filter)
  const threeToHandle: string[] = [
    brief.pending_plus_ones.length > 0 ? `${brief.pending_plus_ones.length} plus-one ${brief.pending_plus_ones.length === 1 ? 'request' : 'requests'} need approval` : null,
    brief.unresolved_maybes.length > 0 ? `${brief.unresolved_maybes.length} maybes to follow up with` : null,
    brief.likely_attendance < 5 ? 'Share your event link to get more RSVPs' : null,
  ].filter((x): x is string => x !== null)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-10 gap-4">
        <div>
          <Link to="/dashboard" className="font-mono text-sm text-dim hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary rounded">&larr; Back to events</Link>
          <h1 className="font-serif text-4xl font-bold text-ink mt-3 mb-1">{event.title}</h1>
          <p className="font-mono text-sm text-dim">
            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}{event.location}
          </p>
        </div>
        <button
          onClick={() => { void copyLink() }}
          className="bg-primary text-ink font-mono font-medium px-5 py-3 rounded-full min-h-[44px] hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark whitespace-nowrap shrink-0"
        >
          {copied ? 'Copied!' : 'Copy invite link'}
        </button>
      </div>

      <div className="bg-ink rounded-3xl p-8 mb-10">
        <h2 className="font-serif text-2xl font-bold text-primary mb-6">Host Brief</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-paper/10 rounded-2xl p-4 text-center">
            <p className="font-serif text-3xl font-bold text-primary">{brief.likely_attendance}</p>
            <p className="font-mono text-xs text-dim mt-1">Likely attending</p>
          </div>
          <div className="bg-paper/10 rounded-2xl p-4 text-center">
            <p className="font-serif text-3xl font-bold text-paper">{brief.total_yes}</p>
            <p className="font-mono text-xs text-dim mt-1">Confirmed</p>
          </div>
          <div className="bg-paper/10 rounded-2xl p-4 text-center">
            <p className="font-serif text-3xl font-bold text-paper">{brief.total_maybe}</p>
            <p className="font-mono text-xs text-dim mt-1">Maybe</p>
          </div>
          <div className="bg-paper/10 rounded-2xl p-4 text-center">
            <p className="font-serif text-3xl font-bold text-paper">{brief.total_no}</p>
            <p className="font-mono text-xs text-dim mt-1">Cannot make it</p>
          </div>
        </div>
        {threeToHandle.length > 0 ? (
          <div>
            <p className="font-mono text-xs text-dim uppercase tracking-widest mb-3">Things to handle</p>
            <div className="flex flex-col gap-2">
              {threeToHandle.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-paper/10 rounded-xl px-4 py-3">
                  <span className="text-primary font-mono text-sm font-bold">{i + 1}</span>
                  <p className="font-mono text-sm text-paper">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-mono text-sm text-dim">All good. Nothing urgent to handle.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="font-serif text-2xl font-bold text-ink">Guest list</h2>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'yes', 'maybe', 'no'] as GuestFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full font-mono text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary min-h-[36px] ${
                  filter === f ? 'bg-ink text-primary' : 'bg-ink/5 text-dim hover:bg-ink/10'
                }`}
              >
                {f === 'all' ? `All (${rsvps.length})` : f === 'yes' ? `Yes (${brief.total_yes})` : f === 'maybe' ? `Maybe (${brief.total_maybe})` : `No (${brief.total_no})`}
              </button>
            ))}
          </div>
        </div>
        {filteredRsvps.length === 0 && (
          <div className="text-center py-16">
            <p className="font-mono text-sm text-dim">No guests in this category yet.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {filteredRsvps.map(r => (
            <div key={r.id} className="bg-white border border-ink/10 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-ink truncate">{r.guest_name}</p>
                <p className="font-mono text-xs text-dim truncate">{r.guest_email}</p>
                {r.maybe_reason && (
                  <p className="font-mono text-xs text-primary-dark mt-1">{MAYBE_LABELS[r.maybe_reason]}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {r.plus_one && (
                  <span className="font-mono text-xs text-dim bg-ink/5 px-2 py-1 rounded-full">+1</span>
                )}
                <span className={`font-mono text-xs px-3 py-1 rounded-full ${
                  r.status === 'yes' ? 'bg-primary/20 text-primary-dark' :
                  r.status === 'maybe' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-50 text-red-600'
                }`}>
                  {r.status === 'yes' ? 'Going' : r.status === 'maybe' ? 'Maybe' : "Cannot go"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
