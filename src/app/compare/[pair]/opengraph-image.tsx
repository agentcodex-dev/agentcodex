import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const alt = 'AgentCodex Compare'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ pair: string }>
}) {
  const { pair } = await params
  const parts = pair.split('-vs-')

  if (parts.length !== 2) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', background: 'white', width: '100%', height: '100%' }} />
      ),
      { ...size }
    )
  }

  const [slugA, slugB] = parts

  const { data: agentA } = await supabase
    .from('agents')
    .select('name, provider')
    .eq('slug', slugA)
    .single()

  const { data: agentB } = await supabase
    .from('agents')
    .select('name, provider')
    .eq('slug', slugB)
    .single()

  const nameA = agentA?.name ?? slugA
  const nameB = agentB?.name ?? slugB
  const providerA = agentA?.provider ?? ''
  const providerB = agentB?.provider ?? ''

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
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '50px',
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
            Side by side comparison
          </div>
        </div>

        {/* VS Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            flex: 1,
          }}
        >
          {/* Agent A Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              flex: 1,
              background: '#eff6ff',
              borderRadius: '24px',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '96px',
                height: '96px',
                borderRadius: '20px',
                background: '#dbeafe',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#2563eb',
              }}
            >
              {nameA.charAt(0)}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#111827',
              }}
            >
              {nameA}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '22px',
                color: '#6b7280',
              }}
            >
              {providerA}
            </div>
          </div>

          {/* VS Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '999px',
              background: '#f3f4f6',
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#6b7280',
              flexShrink: 0,
            }}
          >
            VS
          </div>

          {/* Agent B Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              flex: 1,
              background: '#faf5ff',
              borderRadius: '24px',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '96px',
                height: '96px',
                borderRadius: '20px',
                background: '#ede9fe',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#7c3aed',
              }}
            >
              {nameB.charAt(0)}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#111827',
              }}
            >
              {nameB}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '22px',
                color: '#6b7280',
              }}
            >
              {providerB}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '2px solid #e5e7eb',
            fontSize: '20px',
            color: '#2563eb',
            fontWeight: '600',
          }}
        >
          agentcodex.dev/compare/{pair}
        </div>

      </div>
    ),
    { ...size }
  )
}