import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [rsvps, setRsvps] = useState<Record<string, Rsvp[]>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', location: '', description: '', event_type: 'general' as Event['event_type'] })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  useEffect(() => {
    if (selected) void loadRsvps(selected)
  }, [selected])

  const handleCreate = async () => {
    setFormError('')
    if (!form.title || !form.date || !form.location) { setFormError('Title, date, and location are required.'); return }
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setFormError('Session expired. Please log in again.'); setSaving(false); return }
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
    const { error: insertErr } = await supabase.from('events').insert({
      user_id: session.user.id,
      title: form.title,
      date: form.date,
      location: form.location,
      description: form.description,
      event_type: form.event_type,
      privacy: 'link-only',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" role="status" aria-label="Loading events" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <p className="text-red-600 font-mono text-sm">{error}</p>
        <button onClick={() => { void loadEvents() }} className="bg-primary text-ink font-mono px-6 py-3 rounded-full min-h-[44px] hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark">Try again</button>
      </div>
    )
  }

  const selectedEvent = events.find(e => e.id === selected)
  const brief = selected && rsvps[selected] ? buildBrief(rsvps[selected]) : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-serif text-4xl font-bold text-ink">My Events</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full hover:bg-primary-dark transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          + New event
        </button>
      </div>

      {creating && (
        <div className="bg-white border border-ink/10 rounded-2xl p-8 mb-10 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-ink mb-6">Create an event</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ev-title" className="block font-mono text-sm text-ink mb-2">Event title</label>
              <input id="ev-title" type="text" maxLength={120} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-ink/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]" placeholder="Rooftop Birthday" />
            </div>
            <div>
              <label htmlFor="ev-date" className="block font-mono text-sm text-ink mb-2">Date & time</label>
              <input id="ev-date" type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-ink/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]" />
            </div>
            <div>
              <label htmlFor="ev-loc" className="block font-mono text-sm text-ink mb-2">Location</label>
              <input id="ev-loc" type="text" maxLength={200} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-ink/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]" placeholder="123 Main St, Rooftop" />
            </div>
            <div>
              <label htmlFor="ev-type" className="block font-mono text-sm text-ink mb-2">Event type</label>
              <select id="ev-type" value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value as Event['event_type'] }))} className="w-full border border-ink/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] bg-white">
                <option value="general">General</option>
                <option value="birthday">Birthday</option>
                <option value="dinner">Dinner</option>
                <option value="rooftop">Rooftop</option>
                <option value="housewarming">Housewarming</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="ev-desc" className="block font-mono text-sm text-ink mb-2">Description</label>
              <textarea id="ev-desc" maxLength={1000} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-ink/20 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Tell guests what to expect..." />
            </div>
          </div>
          {formError && <p role="alert" className="text-red-600 font-mono text-sm mt-4">{formError}</p>}
          <div className="flex gap-4 mt-6">
            <button onClick={() => { void handleCreate() }} disabled={saving} className="bg-primary text-ink font-mono font-medium px-6 py-3 rounded-full min-h-[44px] hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark disabled:opacity-60">
              {saving ? 'Creating...' : 'Create event'}
            </button>
            <button onClick={() => { setCreating(false); setFormError('') }} className="border-2 border-primary-dark text-primary-dark font-mono font-medium px-6 py-3 rounded-full min-h-[44px] hover:bg-ink hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary-dark">
              Cancel
            </button>
          </div>
        </div>
      )}

      {events.length === 0 && !creating && (
        <div className="text-center py-20">
          <p className="font-serif text-3xl text-ink mb-4">No events yet</p>
          <p className="text-dim font-mono text-sm mb-8">Create your first event and share the link — guests RSVP in seconds.</p>
          <button onClick={() => setCreating(true)} className="bg-primary text-ink font-mono font-medium px-8 py-4 rounded-full min-h-[44px] hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark">Create your first event</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {events.map(ev => (
          <div
            key={ev.id}
            className={`text-left rounded-2xl border p-6 transition-all ${
              selected === ev.id ? 'border-primary bg-white shadow-md' : 'border-ink/10 bg-white hover:shadow-sm'
            }`}
          >
            <button
              onClick={() => setSelected(selected === ev.id ? null : ev.id)}
              className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
            >
              <span className="font-mono text-xs text-dim uppercase tracking-widest">{ev.event_type}</span>
              <h3 className="font-serif text-xl font-bold text-ink mt-1 mb-2">{ev.title}</h3>
              <p className="font-mono text-sm text-dim">{new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="font-mono text-sm text-dim mt-1">{ev.location}</p>
            </button>
            <div className="flex gap-3 mt-4 pt-4 border-t border-ink/10">
              <Link
                to={`/events/${ev.id}`}
                className="flex-1 text-center bg-ink text-primary font-mono text-xs font-medium px-3 py-2 rounded-full min-h-[36px] flex items-center justify-center hover:bg-ink/80 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Manage &rarr;
              </Link>
              <button
                onClick={() => { void copyEventLink(ev) }}
                className="flex-1 text-center border border-ink/20 text-ink font-mono text-xs font-medium px-3 py-2 rounded-full min-h-[36px] hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {copiedId === ev.id ? 'Copied!' : 'Share link'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && brief && (
        <div className="mt-10 bg-ink rounded-3xl p-8">
          <h2 className="font-serif text-3xl font-bold text-primary mb-2">Host Brief</h2>
          <p className="font-mono text-sm text-dim mb-8">{selectedEvent.title} — {new Date(selectedEvent.date).toLocaleDateString()}</p>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-paper/10 rounded-2xl p-5 text-center">
              <p className="font-serif text-4xl font-bold text-primary">{brief.likely_attendance}</p>
              <p className="font-mono text-xs text-dim mt-1">Likely attending</p>
            </div>
            <div className="bg-paper/10 rounded-2xl p-5 text-center">
              <p className="font-serif text-4xl font-bold text-paper">{brief.total_yes}</p>
              <p className="font-mono text-xs text-dim mt-1">Confirmed yes</p>
            </div>
            <div className="bg-paper/10 rounded-2xl p-5 text-center">
              <p className="font-serif text-4xl font-bold text-paper">{brief.total_maybe}</p>
              <p className="font-mono text-xs text-dim mt-1">Maybes</p>
            </div>
          </div>
          {brief.unresolved_maybes.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-bold text-paper mb-4">Unresolved maybes — follow up</h3>
              <div className="flex flex-col gap-3">
                {brief.unresolved_maybes.map(r => (
                  <div key={r.id} className="bg-paper/10 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-paper">{r.guest_name}</p>
                      <p className="font-mono text-xs text-dim">{r.guest_email}</p>
                    </div>
                    {r.maybe_reason && (
                      <span className="bg-primary/20 text-primary font-mono text-xs px-3 py-1 rounded-full">{MAYBE_LABELS[r.maybe_reason]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {brief.unresolved_maybes.length === 0 && (
            <p className="font-mono text-sm text-dim">All maybes have been resolved. You're all set.</p>
          )}
        </div>
      )}
    </div>
  )
}
