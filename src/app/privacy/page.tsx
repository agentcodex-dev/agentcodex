import Navigation from '@/components/Navigation'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AgentCodex privacy policy and data practices',
}

export default function PrivacyPage() {
  const lastUpdated = 'May 12, 2026'

  return (
    <div className="min-h-screen acx-shell">
      <Navigation />
      <section className="acx-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <h1 className="text-3xl font-bold text-[var(--acx-text)]">Privacy Policy</h1>
          <p className="acx-body mt-2">
            How AgentCodex handles analytics and operational data.
          </p>
          <p className="text-sm acx-muted mt-4">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="acx-panel p-6 sm:p-8 space-y-7 text-sm acx-body leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Overview
            </h2>
            <p>
              AgentCodex (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates agentcodex.dev. 
              This policy explains how we handle information when 
              you use our website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Information We Collect
            </h2>
            <p>
              We collect anonymous usage data including pages visited, 
              time spent on pages and general location (country level). 
              We do not collect personally identifiable information.
            </p>
            <p>
              We use Vercel Analytics for this purpose. 
              Vercel Analytics is privacy-friendly and cookieless. 
              No personal data is stored or sold.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Cookies
            </h2>
            <p>
              AgentCodex does not use tracking cookies. 
              Our analytics solution is cookieless by design.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Third Party Services
            </h2>
            <p>
              We use the following third party services to operate 
              AgentCodex:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[var(--acx-text-soft)]">
              <li>Vercel - hosting and analytics</li>
              <li>Supabase - database infrastructure</li>
            </ul>
            <p>
              Each service has their own privacy policy governing 
              their data practices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Data Retention
            </h2>
            <p>
              Anonymous analytics data is retained for 90 days. 
              We do not retain any personally identifiable information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Your Rights
            </h2>
            <p>
              Since we do not collect personal data, there is nothing 
              to access, correct or delete. If you have questions 
              about our privacy practices please contact us at 
              info@agentcodex.dev
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Changes to This Policy
            </h2>
            <p>
              We may update this policy as our practices change. 
              We will update the date at the top of this page 
              when changes are made.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--acx-text)]">
              Contact
            </h2>
            <p>
              Questions about this policy? 
              Email us at info@agentcodex.dev
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
