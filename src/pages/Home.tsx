import { Link } from 'react-router-dom'

const features = [
  {
    icon: '📋',
    title: 'Host Brief',
    body: 'A calm, prioritized view: likely attendance, unresolved maybes, and the three things you actually need to handle today.'
  },
  {
    icon: '🤔',
    title: 'Better Maybe',
    body: 'Guests who pick Maybe choose a real reason — schedule conflict, waiting on a plus-one, arriving late, need more info. You get signal, not silence.'
  },
  {
    icon: '🎭',
    title: 'Dual View',
    body: 'One invite, two modes. Vibe View for your close friends. Simple View for family and coworkers. Same event, right tone for everyone.'
  },
  {
    icon: '✨',
    title: 'Smart Themes',
    body: 'Getfetti prompts dietary questions for dinners, weather backup for rooftops, and registry links for housewarmings — automatically.'
  }
]

const steps = [
  { n: '01', text: 'Create your event — title, date, location, vibe.' },
  { n: '02', text: 'Share the link. Guests RSVP in seconds, no app needed.' },
  { n: '03', text: 'Your Host Brief shows you exactly who is coming and what needs attention.' }
]

export default function Home() {
  return (
    <div className="bg-paper">
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <span className="inline-block bg-primary text-ink text-xs font-mono font-medium px-4 py-1 rounded-full mb-6">Now in early access</span>
        <h1 className="font-serif text-5xl md:text-7xl font-extrabold text-ink leading-tight mb-6">
          The invite that<br className="hidden md:block" /> helps you host.
        </h1>
        <p className="text-dim font-mono text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Beautiful invites for birthdays, dinners, and gatherings — with guest clarity that actually helps you plan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="bg-primary text-ink font-mono font-medium px-8 py-4 rounded-full hover:bg-primary-dark transition-colors min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            Host your first event — free
          </Link>
          <Link
            to="/login"
            className="border-2 border-primary-dark text-primary-dark font-mono font-medium px-8 py-4 rounded-full hover:bg-ink hover:text-primary transition-colors min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="bg-ink py-20 px-6" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="features-heading" className="font-serif text-4xl font-bold text-paper text-center mb-14">Designed for calmer hosting</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map(f => (
              <div key={f.title} className="bg-paper/10 rounded-2xl p-8 border border-paper/10">
                <span className="text-3xl block mb-4" aria-hidden="true">{f.icon}</span>
                <h3 className="font-serif text-xl font-bold text-paper mb-3">{f.title}</h3>
                <p className="font-mono text-sm text-dim leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-4xl mx-auto" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-serif text-4xl font-bold text-ink text-center mb-14">Up in three steps</h2>
        <div className="flex flex-col gap-8">
          {steps.map(s => (
            <div key={s.n} className="flex gap-6 items-start">
              <span className="font-serif text-5xl font-extrabold text-primary leading-none flex-shrink-0">{s.n}</span>
              <p className="font-mono text-ink text-lg leading-relaxed pt-2">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-20 px-6 text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-extrabold text-paper mb-6">Your guests deserve a great invite.</h2>
        <p className="text-dim font-mono text-lg mb-10 max-w-xl mx-auto">You deserve to know who's actually coming.</p>
        <Link
          to="/signup"
          className="bg-primary text-ink font-mono font-medium px-10 py-4 rounded-full hover:bg-primary-dark transition-colors min-h-[44px] inline-flex items-center focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          Create your first event
        </Link>
      </section>
    </div>
  )
}
