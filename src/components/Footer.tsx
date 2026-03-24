export default function Footer() {
  return (
    <footer className="bg-ink text-paper px-6 py-10 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="font-serif text-xl font-bold text-primary">Getfetti</span>
          <p className="text-dim text-sm mt-1 font-mono">Beautiful invites. Clearer RSVPs. Calmer hosting.</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm font-mono" aria-label="Footer navigation">
          <a href="/privacy" className="text-dim hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Privacy Policy</a>
          <a href="/terms" className="text-dim hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Terms of Service</a>
          <a href="mailto:hello@getfetti.com" className="text-dim hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Contact</a>
        </nav>
      </div>
      <p className="text-center text-dim text-xs font-mono mt-8">&copy; {new Date().getFullYear()} Getfetti. All rights reserved.</p>
    </footer>
  )
}
