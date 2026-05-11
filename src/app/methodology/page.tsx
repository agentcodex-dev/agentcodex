import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Methodology - How AgentCodex Scores and Compares',
  description: 'Understand how AgentCodex tracks releases, scores capabilities, and powers workflow-based AI agent comparisons.',
  alternates: {
    canonical: 'https://agentcodex.dev/methodology',
  },
}

const SCORE_DIMENSIONS = [
  'Coding',
  'Reasoning',
  'Tool use',
  'Memory',
  'Multimodal',
  'Speed',
]

const FAQS = [
  {
    q: 'What mechanism are you using to rate the models?',
    a: 'AgentCodex scores each release version across standardized capability dimensions on a 1 to 10 scale. Scores are derived from release evidence and normalized through validation and calibration rules so missing or invalid values do not distort results.',
  },
  {
    q: 'What are you using under the hood during comparison?',
    a: 'Comparison is version-aware and capability-weighted. AgentCodex aligns each selected agent\'s latest published profile, applies preset workflow weights, and shows side-by-side capability fit with direct links back to source-aware version context.',
  },
  {
    q: 'Is this benchmark data or live product intelligence?',
    a: 'It is release intelligence, not a synthetic benchmark leaderboard. AgentCodex tracks shipped updates from public sources and highlights what changed, when it changed, and where the source signal came from.',
  },
  {
    q: 'How do you reduce bias or inconsistency?',
    a: 'We use fixed capability dimensions, deterministic validation rules, source-quality signals, and human review workflows for drafts. This keeps scoring more consistent and easier to audit over time.',
  },
]

export default function MethodologyPage() {
  return (
    <div className="min-h-screen acx-shell">
      <Navigation />

      <section className="acx-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <p className="text-sm font-semibold text-[var(--acx-accent)]">Trust Center</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--acx-text)] mt-3 leading-tight">
            How AgentCodex Works
          </h1>
          <p className="text-base sm:text-lg acx-body mt-4 leading-relaxed max-w-3xl">
            AgentCodex tracks real release signals, converts them into structured version intelligence, and helps teams compare AI agents with transparent scoring context.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        <section className="acx-panel p-6">
          <h2 className="text-xl font-bold text-[var(--acx-text)]">What We Track</h2>
          <p className="text-sm acx-body mt-2 leading-relaxed">
            We monitor agent releases, version notes, and source links, then store each release as a version record with capability and impact metadata.
          </p>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {SCORE_DIMENSIONS.map((item) => (
              <li key={item} className="acx-chip">{item}</li>
            ))}
          </ul>
        </section>

        <section className="acx-panel p-6">
          <h2 className="text-xl font-bold text-[var(--acx-text)]">How Scoring Works</h2>
          <div className="mt-4 space-y-3 text-sm acx-body leading-relaxed">
            <p>1. Parse release evidence into structured fields.</p>
            <p>2. Score capability dimensions on a normalized 1-10 scale.</p>
            <p>3. Validate and sanitize invalid values before publishing.</p>
            <p>4. Rank release movement and velocity using version timelines.</p>
          </div>
        </section>

        <section className="acx-panel p-6">
          <h2 className="text-xl font-bold text-[var(--acx-text)]">How Comparison Works</h2>
          <p className="text-sm acx-body mt-2 leading-relaxed">
            Compare uses the latest published version per agent and applies workflow presets with weighted capabilities. This means every shortlist reflects both capability fit and current release state.
          </p>
        </section>

        <section className="acx-panel p-6">
          <h2 className="text-xl font-bold text-[var(--acx-text)]">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((item) => (
              <div key={item.q} className="border border-[var(--acx-divider)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--acx-text)]">{item.q}</h3>
                <p className="text-sm acx-body mt-2 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
