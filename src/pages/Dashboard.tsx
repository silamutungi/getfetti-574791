import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
    total_yes:          yes.length,
    total_no:           no.length,
    total_maybe:        maybes.length,
    unresolved_maybes:  maybes,
    pending_plus_ones:  rsvps.filter(r => r.plus_one && r.status === 'maybe'),
    likely_attendance:  yes.length + Math.round(maybes.length * 0.5),
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-border p-6 bg-white space-y-4 animate-pulse">
      <div className="skeleton h-3 w-16 rounded-full" />
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-2/3" />
      <div className="flex gap-3 pt-2">
        <div className="skeleton h-9 flex-1 rounded-full" />
        <div className="skeleton h-9 flex-1 rounded-full" />
      </div>
    </div>
  )
}

const FIELD_CLS = `
  w-full border border-border rounded-2xl px-4 py-3 font-mono text-sm text-ink
  bg-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px]
  transition-all duration-150 placeholder:text-dim/60
`

export default function Dashboard() {
  const [events,   setEvents]   = useState<Event[]>([])
  const [rsvps,    setRsvps]    = useState<Record<string, Rsvp[]>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '', date: '', location: '', description: '',
    event_type: 'general' as Event['event_type'],
  })
  const [saving,     setSaving]    = useState(false)
  const [formError,  setFormError] = useState('')
  const [copiedId,   setCopiedId]  = useState<string | null>(null)

  const loadEvents = async () => {
    setLoading(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Your session expired. Please log in again.'); setLoading(false); return }
    const { data, error: dbErr } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .order('date', { ascending: true })
    if (dbErr) { setError('Could not load your events. Try refreshing.'); setLoading(false); return }
    setEvents(data ?? [])
    setLoading(false)
  }

  const loadRsvps = async (eventId: string) => {
    const { data } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .is('deleted_at', null)
    setRsvps(prev => ({ ...prev, [eventId]: data ?? [] }))
  }

  useEffect(() => { void loadEvents() }, [])
  useEffect(() => { if (selected) void loadRsvps(selected) }, [selected])

  const handleCreate = async () => {
    setFormError('')
    if (!form.title || !form.date || !form.location) {
      setFormError('Title, date, and location are required.')
      return
    }
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setFormError('Session expired. Please log in again.'); setSaving(false); return }
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
    const { error: insertErr } = await supabase.from('events').insert({
      user_id:       session.user.id,
      title:         form.title,
      date:          form.date,
      location:      form.location,
      description:   form.description,
      event_type:    form.event_type,
      privacy:       'link-only',
      plus_one_rule: 'ask',
      slug,
    })
    setSaving(false)
    if (insertErr) { setFormError('Could not create your event. Please try again.'); return }
    setCreating(false)
    setForm({ title: '', date: '', location: '', description: '', event_type: 'general' })
    void loadEvents()
  }

  const copyEventLink = async (ev: Event) => {
    const url = `${window.location.origin}/rsvp/${ev.slug}`
    await navigator.clipboard.writeText(url)
    setCopiedId(ev.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Error ────────────────────────────────────────────────

  if (!loading && error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6">
      <span className="text-4xl" aria-hidden="true">😬</span>
      <p className="font-mono text-sm text-dim text-center">{error}</p>
      <button
        type="button"
        onClick={() => { void loadEvents() }}
        className="bg-primary text-ink font-mono font-semibold px-7 py-3 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-200"
      >
        Try again
      </button>
    </div>
  )

  const selectedEvent = events.find(e => e.id === selected)
  const brief = selected && rsvps[selected] ? buildBrief(rsvps[selected]) : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-10 gap-4">
        <h1 className="font-serif font-bold text-ink" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
          My Events
        </h1>
        <button
          type="button"
          onClick={() => { setCreating(!creating); setFormError('') }}
          className={`
            font-mono font-semibold text-sm px-6 py-3 rounded-full min-h-[44px]
            transition-all duration-200 active:scale-[0.97]
            ${creating
              ? 'bg-surface border border-border text-dim hover:border-ink'
              : 'bg-primary text-ink hover:bg-primary-dark hover:text-white shadow-sm hover:shadow-md'
            }
          `}
        >
          {creating ? 'Cancel' : '+ New event'}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white border border-border rounded-3xl p-7 mb-10 shadow-sm animate-slide-dn">
          <h2 className="font-serif text-2xl font-bold text-ink mb-6">Create an event</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ev-title" className="block font-mono text-xs uppercase tracking-widest text-dim mb-2">Event title</label>
              <input id="ev-title" type="text" maxLength={120} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={FIELD_CLS} placeholder="Rooftop Birthday" />
            </div>
            <div>
              <label htmlFor="ev-date" className="block font-mono text-xs uppercase tracking-widest text-dim mb-2">Date &amp; time</label>
              <input id="ev-date" type="datetime-local" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={FIELD_CLS} />
            </div>
            <div>
              <label htmlFor="ev-loc" className="block font-mono text-xs uppercase tracking-widest text-dim mb-2">Location</label>
              <input id="ev-loc" type="text" maxLength={200} value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className={FIELD_CLS} placeholder="123 Main St" />
            </div>
            <div>
              <label htmlFor="ev-type" className="block font-mono text-xs uppercase tracking-widest text-dim mb-2">Event type</label>
              <select id="ev-type" value={form.event_type}
                onChange={e => setForm(f => ({ ...f, event_type: e.target.value as Event['event_type'] }))}
                className={FIELD_CLS + ' bg-surface cursor-pointer'}
              >
                <option value="general">✨ General</option>
                <option value="birthday">🎂 Birthday</option>
                <option value="dinner">🍽 Dinner</option>
                <option value="rooftop">🌇 Rooftop</option>
                <option value="housewarming">🏠 Housewarming</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="ev-desc" className="block font-mono text-xs uppercase tracking-widest text-dim mb-2">Description (optional)</label>
              <textarea id="ev-desc" maxLength={1000} rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={FIELD_CLS + ' resize-none'} placeholder="Tell guests what to expect..." />
            </div>
          </div>

          {formError && (
            <p role="alert" className="font-mono text-sm text-red-600 mt-4">{formError}</p>
          )}

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => { void handleCreate() }}
              disabled={saving}
              className="bg-primary text-ink font-mono font-semibold px-7 py-3 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-200 disabled:opacity-60 active:scale-[0.97]"
            >
              {saving ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[0,1,2].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : events.length === 0 && !creating ? (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl">
          <div className="text-5xl mb-5 select-none" aria-hidden="true">🎈</div>
          <h2 className="font-serif text-2xl font-bold text-ink mb-3">No events yet</h2>
          <p className="font-mono text-sm text-dim mb-8 max-w-xs mx-auto leading-relaxed">
            Create your first event and share the link. Guests RSVP in seconds.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="bg-primary text-ink font-mono font-semibold px-8 py-3 rounded-full min-h-[44px] hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {events.map((ev, i) => (
            <div
              key={ev.id}
              className={`
                relative rounded-3xl border bg-white transition-all duration-200 overflow-hidden
                ${selected === ev.id
                  ? 'border-primary-dark shadow-md ring-1 ring-primary'
                  : 'border-border hover:shadow-md hover:border-border/80'
                }
              `}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Type strip */}
              <div className={`h-1.5 w-full ${selected === ev.id ? 'bg-primary' : 'bg-surface-2'}`} />

              <div className="p-6">
                {/* Type + title */}
                <button
                  type="button"
                  onClick={() => setSelected(selected === ev.id ? null : ev.id)}
                  className="w-full text-left focus-visible:outline-none group"
                  aria-expanded={selected === ev.id}
                >
                  <p className="font-mono text-xs text-dim uppercase tracking-widest mb-1">
                    {EVENT_TYPE_EMOJI[ev.event_type]} {ev.event_type}
                  </p>
                  <h3 className="font-serif text-xl font-bold text-ink mb-3 group-hover:text-primary-dark transition-colors leading-tight">
                    {ev.title}
                  </h3>
                  <p className="font-mono text-sm text-dim">
                    {new Date(ev.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                  <p className="font-mono text-sm text-dim mt-0.5 truncate">{ev.location}</p>
                </button>

                {/* Actions */}
                <div className="flex gap-2.5 mt-5 pt-5 border-t border-border">
                  <Link
                    to={`/events/${ev.id}`}
                    className="flex-1 text-center bg-ink text-primary font-mono text-xs font-semibold px-3 py-2.5 rounded-full min-h-[38px] flex items-center justify-center hover:bg-ink/80 transition-all duration-150 focus-visible:outline-none"
                  >
                    Manage &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => { void copyEventLink(ev) }}
                    className={`
                      flex-1 text-center font-mono text-xs font-semibold px-3 py-2.5 rounded-full
                      min-h-[38px] transition-all duration-150 focus-visible:outline-none
                      ${copiedId === ev.id
                        ? 'bg-primary text-ink'
                        : 'border border-border text-ink hover:bg-surface'
                      }
                    `}
                  >
                    {copiedId === ev.id ? 'Copied!' : 'Share link'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Host Brief panel */}
      {selectedEvent && brief && (
        <div className="mt-8 bg-ink rounded-3xl p-8 animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary mb-1">Host Brief</h2>
              <p className="font-mono text-sm text-dim">
                {selectedEvent.title} &middot;{' '}
                {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric',
                })}
              </p>
            </div>
            <Link
              to={`/events/${selectedEvent.id}`}
              className="font-mono text-xs text-dim hover:text-primary transition-colors shrink-0 mt-1"
            >
              Full view &rarr;
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: brief.likely_attendance, label: 'Likely attending', highlight: true },
              { value: brief.total_yes,          label: 'Confirmed yes' },
              { value: brief.total_maybe,        label: 'Maybes' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/6 rounded-2xl p-4 text-center">
                <p className={`font-serif text-4xl font-bold ${stat.highlight ? 'text-primary' : 'text-paper'}`}>
                  {stat.value}
                </p>
                <p className="font-mono text-xs text-dim mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Follow-ups */}
          {brief.unresolved_maybes.length > 0 ? (
            <div>
              <p className="font-mono text-xs text-dim uppercase tracking-widest mb-3">
                Maybes to follow up with
              </p>
              <div className="flex flex-col gap-2">
                {brief.unresolved_maybes.slice(0, 4).map(r => (
                  <div key={r.id} className="bg-white/6 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-paper truncate">{r.guest_name}</p>
                      <p className="font-mono text-xs text-dim truncate">{r.guest_email}</p>
                    </div>
                    {r.maybe_reason && (
                      <span className="font-mono text-xs bg-primary/15 text-primary px-3 py-1 rounded-full shrink-0">
                        {MAYBE_LABELS[r.maybe_reason]}
                      </span>
                    )}
                  </div>
                ))}
                {brief.unresolved_maybes.length > 4 && (
                  <p className="font-mono text-xs text-dim text-center pt-1">
                    + {brief.unresolved_maybes.length - 4} more
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-primary/10 rounded-2xl px-5 py-4">
              <span className="text-2xl" aria-hidden="true">✓</span>
              <p className="font-mono text-sm text-primary">All maybes resolved. You are all set.</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
