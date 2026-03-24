import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, type RefObject } from 'react'

function useInView(threshold = 0.12): { ref: RefObject<HTMLDivElement>; visible: boolean } {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

const features = [
  {
    emoji: '📋',
    tag: 'For the host',
    tagColor: 'bg-primary/25 text-primary-dark',
    title: 'Host Brief',
    hook: 'Know before you shop.',
    body: "One calm view: who is definitely coming, who is probably coming, and who needs a gentle nudge. No spreadsheet required.",
  },
  {
    emoji: '🤔',
    tag: 'Fewer follow-ups',
    tagColor: 'bg-coral/20 text-coral',
    title: 'Better Maybe',
    hook: 'A maybe with context.',
    body: "Guests who pick Maybe choose a real reason — schedule conflict, waiting on a plus-one, arriving late, need more info. You always know where you stand.",
  },
  {
    emoji: '✨',
    tag: 'Guest experience',
    tagColor: 'bg-ink/8 text-ink',
    title: 'Dual View',
    hook: 'Beautiful for every crowd.',
    body: "Toggle between Vibe View (dark, editorial) and Simple View (light, clean). Same event, right tone for everyone.",
  },
]

const steps = [
  { n: '01', title: 'Create your event', body: 'Add the details. Getfetti builds a beautiful invite page instantly.' },
  { n: '02', title: 'Share the link', body: 'One link, zero friction. Guests RSVP in under 30 seconds — no account needed.' },
  { n: '03', title: 'Host with clarity', body: 'Your Host Brief shows who is coming, who might come, and who needs a nudge.' },
]

export default function Home() {
  const hero   = useInView(0.05)
  const feats  = useInView()
  const how    = useInView()
  const cta    = useInView()

  return (
    <div className="bg-paper">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div
        ref={hero.ref}
        className="max-w-5xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32"
      >
        <div
          className="transition-all duration-700 ease-out"
          style={{ opacity: hero.visible ? 1 : 0, transform: hero.visible ? 'none' : 'translateY(28px)' }}
        >
          {/* Label */}
          <span className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-dim border border-border rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Now in early access
          </span>

          {/* Headline */}
          <h1
            className="font-serif font-extrabold text-ink leading-none tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            The invite app<br />
            that actually<br />
            <em className="not-italic text-primary-dark">helps you host.</em>
          </h1>

          <p className="font-mono text-lg md:text-xl text-dim max-w-xl leading-relaxed mb-10">
            Beautiful invites for birthdays, dinners, and gatherings —
            with guest clarity that actually helps you plan.
          </p>

          {/* CTAs */}
          <div className="flex flex-col xs:flex-row gap-4 mb-14">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary text-ink font-mono font-semibold text-base px-8 py-4 rounded-full hover:bg-primary-dark hover:text-white transition-all duration-200 min-h-[52px] shadow-sm hover:shadow-md active:scale-[0.97]"
            >
              Host your first event — free
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-transparent text-ink font-mono text-base px-8 py-4 rounded-full border border-border hover:border-ink transition-all duration-200 min-h-[52px] active:scale-[0.97]"
            >
              Log in
            </Link>
          </div>

          {/* Trust line */}
          <p className="font-mono text-sm text-dim">
            Free to get started &middot; No credit card needed
          </p>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────── */}
      <div
        ref={feats.ref}
        className="px-6 py-16 md:py-24"
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-xs tracking-widest uppercase text-dim mb-10 transition-all duration-700"
            style={{ opacity: feats.visible ? 1 : 0, transform: feats.visible ? 'none' : 'translateY(16px)' }}
          >
            What makes Getfetti different
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group bg-surface rounded-3xl p-8 border border-border/60 hover:shadow-md hover:border-border transition-all duration-300"
                style={{
                  opacity:   feats.visible ? 1 : 0,
                  transform: feats.visible ? 'none' : 'translateY(24px)',
                  transition: `opacity 0.5s ease ${i * 90}ms, transform 0.5s ease ${i * 90}ms, box-shadow 0.3s ease, border-color 0.3s ease`,
                }}
              >
                <div className="text-4xl mb-5 group-hover:animate-heartbeat">{f.emoji}</div>
                <span className={`inline-block font-mono text-xs px-3 py-1 rounded-full mb-4 ${f.tagColor}`}>
                  {f.tag}
                </span>
                <h3 className="font-serif text-2xl font-bold text-ink mb-1">{f.title}</h3>
                <p className="font-mono text-sm font-medium text-ink mb-3">{f.hook}</p>
                <p className="font-mono text-sm text-dim leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works — dark section ─────────────────────── */}
      <div
        ref={how.ref}
        className="bg-ink py-20 md:py-28 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div
            style={{
              opacity: how.visible ? 1 : 0,
              transform: how.visible ? 'none' : 'translateY(24px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-4">
              How it works
            </p>
            <h2
              className="font-serif font-bold text-paper mb-16 leading-tight"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.02em' }}
            >
              From idea to invites
              <br />
              in under two minutes.
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              {steps.map((step, i) => (
                <div
                  key={step.n}
                  className="flex gap-5"
                  style={{
                    opacity: how.visible ? 1 : 0,
                    transform: how.visible ? 'none' : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${i * 100 + 200}ms, transform 0.5s ease ${i * 100 + 200}ms`,
                  }}
                >
                  <span
                    className="font-serif font-extrabold text-dim/30 leading-none flex-shrink-0 select-none"
                    style={{ fontSize: '3.5rem' }}
                  >
                    {step.n}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-mono font-semibold text-paper mb-2">{step.title}</h3>
                    <p className="font-mono text-sm text-dim leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <div
        ref={cta.ref}
        className="px-6 py-24 md:py-32 text-center"
      >
        <div
          className="max-w-xl mx-auto"
          style={{
            opacity: cta.visible ? 1 : 0,
            transform: cta.visible ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div
            className="font-sans mb-6 select-none"
            style={{ fontSize: '3.5rem', lineHeight: 1 }}
            aria-hidden="true"
          >
            🎉
          </div>
          <h2
            className="font-serif font-bold text-ink mb-5 leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.02em' }}
          >
            Your next event
            <br />
            deserves better.
          </h2>
          <p className="font-mono text-dim text-lg leading-relaxed mb-10">
            Beautiful invites. Calmer hosting. Free to start.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-3 bg-primary text-ink font-mono font-semibold text-base px-10 py-4 rounded-full hover:bg-primary-dark hover:text-white transition-all duration-200 min-h-[52px] shadow-sm hover:shadow-md active:scale-[0.97]"
          >
            Create your first event
            <span aria-hidden="true">→</span>
          </Link>
          <p className="font-mono text-xs text-dim mt-5">
            No credit card. No setup. Just your event.
          </p>
        </div>
      </div>
    </div>
  )
}
