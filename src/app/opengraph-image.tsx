import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AgentCodex - The Definitive AI Agent Reference'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '24px',
          }}
        >
          <span style={{ color: '#111827' }}>Agent</span>
          <span style={{ color: '#2563eb' }}>Codex</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: '36px',
            color: '#6b7280',
            marginBottom: '48px',
          }}
        >
          The Definitive AI Agent Reference
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '48px',
          }}
        >
          {[
            '📋 Version History',
            '⚡ Capabilities',
            '⚖️ Compare',
            '🔄 Daily Updates',
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                background: '#f3f4f6',
                color: '#374151',
                padding: '12px 24px',
                borderRadius: '999px',
                fontSize: '22px',
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            gap: '60px',
          }}
        >
          {[
            { number: '20+', label: 'Agents Tracked' },
            { number: '50+', label: 'Versions Documented' },
            { number: 'Daily', label: 'Updates' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#2563eb',
                }}
              >
                {stat.number}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '20px',
                  color: '#6b7280',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* URL bottom right */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '20px',
            color: '#9ca3af',
          }}
        >
          agentcodex.dev
        </div>

      </div>
    ),
    { ...size }
  )
}