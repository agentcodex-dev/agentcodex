import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { PlatformBadge, PlatformHeader, PlatformMetric, PlatformPanel, PlatformShell } from '@/components/platform/PlatformUI'

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

const PROCESS = [
  ['Source ingestion', 'Official changelogs, docs, blogs, and source URLs are collected as candidate release evidence.'],
  ['Extraction', 'Release text is converted into structured fields like version, change summary, context, pricing, and capabilities.'],
  ['Validation', 'Invalid values are sanitized and confidence/source signals are attached before publishing.'],
  ['Scoring', 'Capability dimensions and movement deltas are normalized for comparison and radar views.'],
  ['Publishing', 'Approved records power Radar, profiles, directory, compare, categories, and copilot shortlists.'],
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

      <PlatformShell>
        <PlatformHeader
          title="How AgentCodex Works"
          subtitle="A transparent trust center for source collection, extraction, confidence, scoring, and published release intelligence."
        />
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformMetric label="Confidence" value="Extracted / EST" detail="not all values are measured" tone="amber" />
          <PlatformMetric label="Capability Scale" value="1-10" detail="normalized dimensions" tone="blue" />
          <PlatformMetric label="Metadata Gaps" value="Honest" detail="not captured is shown plainly" tone="green" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <PlatformPanel title="What We Track" subtitle="Version-aware release intelligence, not benchmark leaderboards">
              <div className="p-4">
                <p className="acx-code-badge acx-muted mb-3">Scope</p>
                <p className="text-sm leading-relaxed acx-body">
                  AgentCodex monitors agent releases, version notes, source links, and structured metadata. Each published record becomes part of the radar, profile timeline, directory, comparison, and copilot shortlist layers.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SCORE_DIMENSIONS.map((item) => (
                    <PlatformBadge key={item} tone="blue">{item}</PlatformBadge>
                  ))}
                </div>
              </div>
            </PlatformPanel>

            <PlatformPanel title="Pipeline" subtitle="How a source becomes an AgentCodex signal">
              <div className="divide-y acx-divider">
                {PROCESS.map(([title, body], index) => (
                  <div key={title} className="grid grid-cols-[2rem_1fr] gap-3 p-4">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--acx-accent-soft)] text-xs font-semibold text-[var(--acx-accent)]">{index + 1}</span>
                    <div>
                      <h3 className="font-semibold text-[var(--acx-text)]">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed acx-muted">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PlatformPanel>

            <PlatformPanel title="Confidence, EST, and Missing Fields">
              <div className="space-y-3 p-4 text-sm leading-relaxed acx-body">
                <p className="acx-code-badge acx-muted">Trust Model</p>
                <p><span className="font-semibold text-[var(--acx-text)]">Confidence</span> comes from extraction confidence when present. If missing, AgentCodex shows an estimated confidence badge instead of pretending it is measured.</p>
                <p><span className="font-semibold text-[var(--acx-text)]">Context window and pricing</span> are shown only when captured on a release or carried forward as a last-known metadata value.</p>
                <p><span className="font-semibold text-[var(--acx-text)]">Source trust</span> indicates whether a release source matches known official domains for that agent.</p>
              </div>
            </PlatformPanel>
          </div>

          <PlatformPanel title="FAQ">
            <div className="space-y-3 p-4">
              {FAQS.map((item) => (
                <div key={item.q} className="rounded-xl border acx-divider bg-[var(--acx-surface)] p-4">
                  <h3 className="font-semibold text-[var(--acx-text)]">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed acx-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </PlatformPanel>
        </div>
      </PlatformShell>

      <Footer />
    </div>
  )
}
