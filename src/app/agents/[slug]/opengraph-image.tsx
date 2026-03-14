import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const alt = 'AgentCodex'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: agent } = await supabase
    .from('agents')
    .select('name, provider, category, description')
    .eq('slug', slug)
    .single()

  const name = agent?.name ?? 'AI Agent'
  const provider = agent?.provider ?? ''
  const description = (agent?.description ?? '').slice(0, 120)
  const categories = (agent?.category ?? []).slice(0, 3)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            <span style={{ color: '#111827' }}>Agent</span>
            <span style={{ color: '#2563eb' }}>Codex</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              color: '#6b7280',
            }}
          >
            The Definitive AI Agent Reference
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            flex: 1,
          }}
        >
          {/* Agent initial */}
          <div
            style={{
              display: 'flex',
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              background: '#dbeafe',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#2563eb',
              flexShrink: 0,
            }}
          >
            {name.charAt(0)}
          </div>

          {/* Agent info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#111827',
                lineHeight: 1,
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                color: '#6b7280',
              }}
            >
              by {provider}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '22px',
                color: '#374151',
                marginTop: '8px',
              }}
            >
              {description}...
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '2px solid #e5e7eb',
          }}
        >
          {/* Categories */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
            }}
          >
            {categories.map((cat: string) => (
              <div
                key={cat}
                style={{
                  display: 'flex',
                  background: '#f3f4f6',
                  color: '#374151',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '18px',
                }}
              >
                {cat}
              </div>
            ))}
          </div>

          {/* URL */}
          <div
            style={{
              display: 'flex',
              fontSize: '20px',
              color: '#2563eb',
              fontWeight: '600',
            }}
          >
            agentcodex.dev
          </div>
        </div>

      </div>
    ),
    { ...size }
  )
}