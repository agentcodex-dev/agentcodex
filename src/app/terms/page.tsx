import Navigation from '@/components/Navigation'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AgentCodex terms of service and usage conditions',
}

export default function TermsPage() {
  const lastUpdated = 'May 12, 2026'

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <h1 className="text-3xl font-bold text-[var(--acx-text)]">Terms of Service</h1>
          <p className="acx-body mt-2">
            Conditions for using AgentCodex and relying on its published intelligence.
          </p>
          <p className="text-sm acx-muted mt-4">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="acx-panel p-6 sm:p-8 space-y-7 text-sm acx-body leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Acceptance of Terms
            </h2>
            <p>
              By accessing agentcodex.dev you agree to these terms. 
              If you do not agree please do not use the site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              About AgentCodex
            </h2>
            <p>
              AgentCodex is a reference resource documenting AI agents, 
              their version histories and capabilities. We aim to provide 
              accurate information but cannot guarantee completeness 
              or accuracy of all entries.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Accuracy of Information
            </h2>
            <p>
              Content on AgentCodex is researched and maintained 
              to the best of our ability. However the AI landscape 
              changes rapidly. Always verify critical information 
              with official sources before making business decisions.
            </p>
            <p>
              We are not affiliated with any of the AI companies 
              or products documented on this site unless explicitly stated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Intellectual Property
            </h2>
            <p>
              The AgentCodex name, logo and original content including 
              capability assessments, descriptions and editorial content 
              are owned by AgentCodex.
            </p>
            <p>
              AI agent names, logos and trademarks belong to their 
              respective owners. Their presence on this site does not 
              imply endorsement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-[var(--acx-text-soft)]">
              <li>Scrape or bulk download content from AgentCodex</li>
              <li>Use content for commercial purposes without permission</li>
              <li>Attempt to disrupt or damage the service</li>
              <li>Misrepresent AgentCodex content as your own</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Disclaimer of Warranties
            </h2>
            <p>
              AgentCodex is provided as is without warranties of any kind. 
              We are not liable for decisions made based on information 
              found on this site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Changes to Terms
            </h2>
            <p>
              We may update these terms as the service evolves. 
              Continued use of AgentCodex after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Contact
            </h2>
            <p>
              Questions about these terms? 
              Email us at info@agentcodex.dev
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
