import Navigation from '@/components/Navigation'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the AgentCodex team',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <p className="acx-eyebrow text-sm">Support</p>
          <h1 className="text-4xl sm:text-5xl font-semibold acx-page-title mt-2">Contact</h1>
          <p className="acx-body mt-3 text-base sm:text-lg max-w-3xl">
            Reach the AgentCodex team for support, corrections, partnerships, and media.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:info@agentcodex.dev?subject=General%20Enquiry"
            className="acx-panel p-5 hover:border-[var(--acx-border-strong)] transition-colors acx-reveal"
          >
            <h2 className="font-semibold text-[var(--acx-text)]">General Enquiries</h2>
            <p className="text-sm acx-body mt-2">
              Product questions, account requests, and roadmap feedback.
            </p>
            <p className="text-sm text-[var(--acx-accent)] mt-3">info@agentcodex.dev</p>
          </a>

          <a
            href="mailto:info@agentcodex.dev?subject=Data%20Correction%20Request"
            className="acx-panel p-5 hover:border-[var(--acx-border-strong)] transition-colors acx-reveal"
          >
            <h2 className="font-semibold text-[var(--acx-text)]">Data Corrections</h2>
            <p className="text-sm acx-body mt-2">
              Report inaccurate release details, scoring, links, or metadata.
            </p>
            <p className="text-sm text-[var(--acx-accent)] mt-3">Request review</p>
          </a>

          <a
            href="mailto:info@agentcodex.dev?subject=Partnership%20Request"
            className="acx-panel p-5 hover:border-[var(--acx-border-strong)] transition-colors acx-reveal"
          >
            <h2 className="font-semibold text-[var(--acx-text)]">Partnerships</h2>
            <p className="text-sm acx-body mt-2">
              Integrations, data partnerships, and ecosystem collaborations.
            </p>
            <p className="text-sm text-[var(--acx-accent)] mt-3">Start a conversation</p>
          </a>

          <a
            href="mailto:info@agentcodex.dev?subject=Press%20Request"
            className="acx-panel p-5 hover:border-[var(--acx-border-strong)] transition-colors acx-reveal"
          >
            <h2 className="font-semibold text-[var(--acx-text)]">Press and Media</h2>
            <p className="text-sm acx-body mt-2">
              Interviews, quotes, and product background for publications.
            </p>
            <p className="text-sm text-[var(--acx-accent)] mt-3">Press contact</p>
          </a>
        </div>

        <section className="acx-panel p-5 mt-6 acx-reveal acx-reveal-delay-1">
          <h2 className="font-semibold text-[var(--acx-text)]">Response Expectations</h2>
          <p className="text-sm acx-body mt-2">
            We usually respond within 1-2 business days. For correction requests, include agent name, version, and source URL so we can verify quickly.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="mailto:info@agentcodex.dev"
              className="acx-btn-primary px-4 py-2 text-sm"
            >
              Email AgentCodex
            </a>
            <a
              href="https://x.com/agentcodex_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="acx-btn-secondary px-4 py-2 text-sm"
            >
              Follow @agentcodex_dev
            </a>
            <Link href="/methodology" className="acx-btn-secondary px-4 py-2 text-sm">
              View Methodology
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
