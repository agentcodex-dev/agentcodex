import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AgentCodex - The Definitive AI Agent Reference',
    template: '%s | AgentCodex'
  },
  description: 'Track AI agent history, compare capabilities and follow version updates. The Wikipedia for AI Agents. Covering Claude, GPT-4, GitHub Copilot, Cursor and more.',
  keywords: [
    'AI agents',
    'Claude',
    'ChatGPT',
    'GitHub Copilot',
    'Cursor',
    'Gemini',
    'AI tools',
    'version history',
    'AI capabilities',
    'LLM comparison'
  ],
  metadataBase: new URL('https://agentcodex.dev'),
  openGraph: {
    title: 'AgentCodex - The Definitive AI Agent Reference',
    description: 'Track AI agent history, compare capabilities and follow version updates.',
    url: 'https://agentcodex.dev',
    siteName: 'AgentCodex',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentCodex - The Definitive AI Agent Reference',
    description: 'Track AI agent history, compare capabilities and follow version updates.',
    creator: '@agentcodex_dev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}