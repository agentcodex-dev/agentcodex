import Navigation from '@/components/Navigation'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the AgentCodex team',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Contact
        </h1>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">

          <p className="text-gray-600">
            Have a question, suggestion or want to report 
            incorrect information? We would love to hear from you.
          </p>

          <div className="space-y-4">

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
              <span className="text-2xl">📧</span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  General Enquiries
                </h3>
                <a 
                  href="mailto:info@agentcodex.dev"
                  className="text-blue-600 hover:text-blue-700"
                >
                  info@agentcodex.dev
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Suggest an Agent
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Know an AI agent we should be tracking?
                  Email us with the name and a brief description.
                </p>
                <a 
                  href="mailto:info@agentcodex.dev?subject=Agent Suggestion"
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Suggest an agent →
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Report Incorrect Information
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Spotted something wrong? We take accuracy seriously.
                  Let us know and we will fix it quickly.
                </p>
                <a 
                  href="mailto:info@agentcodex.dev?subject=Incorrect Information"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  Report an issue →
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
              <span className="text-2xl">🐦</span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Follow on X
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Stay updated on new agents and features
                </p>
                <a 
                  href="https://x.com/agentcodex_dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  @agentcodex_dev →
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>
      <Footer/>
    </div>
  )
}