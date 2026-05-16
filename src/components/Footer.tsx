import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t acx-divider bg-[var(--acx-surface)] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-xl font-semibold acx-page-title text-[var(--acx-text)]">
            Agent<span className="text-[var(--acx-accent)]">Codex</span>
          </Link>

          <div className="flex items-center gap-6 text-sm acx-muted">
            <Link href="/privacy" className="hover:text-[var(--acx-text)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--acx-text)] transition-colors">
              Terms of Service
            </Link>
            <Link href="/methodology" className="hover:text-[var(--acx-text)] transition-colors">
              Methodology
            </Link>
            <Link href="/contact" className="hover:text-[var(--acx-text)] transition-colors">
              Contact
            </Link>
          </div>

          <span className="text-sm acx-muted">
            © {new Date().getFullYear()} AgentCodex. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
