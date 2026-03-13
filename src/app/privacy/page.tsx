import Navigation from '@/components/Navigation'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AgentCodex privacy policy and data practices',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6 text-gray-600">
          
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              month: 'long', day: 'numeric', year: 'numeric' 
            })}
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Overview
            </h2>
            <p>
              AgentCodex ("we", "us", "our") operates agentcodex.dev. 
              This policy explains how we handle information when 
              you use our website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
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
            <h2 className="text-xl font-semibold text-gray-900">
              Cookies
            </h2>
            <p>
              AgentCodex does not use tracking cookies. 
              Our analytics solution is cookieless by design.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Third Party Services
            </h2>
            <p>
              We use the following third party services to operate 
              AgentCodex:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Vercel - hosting and analytics</li>
              <li>Supabase - database infrastructure</li>
            </ul>
            <p>
              Each service has their own privacy policy governing 
              their data practices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Data Retention
            </h2>
            <p>
              Anonymous analytics data is retained for 90 days. 
              We do not retain any personally identifiable information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
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
            <h2 className="text-xl font-semibold text-gray-900">
              Changes to This Policy
            </h2>
            <p>
              We may update this policy as our practices change. 
              We will update the date at the top of this page 
              when changes are made.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Contact
            </h2>
            <p>
              Questions about this policy? 
              Email us at info@agentcodex.dev
            </p>
          </section>

        </div>
      </div>
      <Footer/>
    </div>
  )
}