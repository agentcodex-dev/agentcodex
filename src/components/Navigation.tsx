'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

declare global {
  interface Window {
    __acxSetThemePref?: (pref: 'light' | 'dark' | 'system') => void
  }
}

export default function Navigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { href: '/radar', label: 'Radar' },
    { href: '/agents', label: 'All Agents' },
    { href: '/categories', label: 'Categories' },
    { href: '/compare', label: 'Compare' },
    { href: '/copilot', label: 'Copilot' },
  ]

  function isActive(href: string) {
    if (href === '/radar') return pathname === '/' || pathname.startsWith('/radar')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const onAgentsDirectory = pathname === '/agents'
  const browseClass = onAgentsDirectory
    ? 'acx-btn-outline-accent'
    : 'acx-btn-primary'

  function setThemePref(pref: 'light' | 'dark' | 'system') {
    if (typeof window !== 'undefined' && window.__acxSetThemePref) {
      window.__acxSetThemePref(pref)
    }
  }

  function cycleThemePref() {
    const current = document.documentElement.getAttribute('data-theme-pref')
    const next =
      current === 'system'
        ? 'light'
        : current === 'light'
          ? 'dark'
          : 'system'
    setThemePref(next)
  }

  return (
    <nav className="border-b acx-divider bg-[var(--acx-surface)]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-semibold acx-page-title text-[var(--acx-text)]">
              Agent<span className="text-[var(--acx-accent)]">Codex</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={isActive(link.href)}
                className="acx-nav-link text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <button
                onClick={cycleThemePref}
                aria-label="Cycle theme mode"
                title="Cycle theme mode"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border acx-divider acx-body acx-btn-ghost"
              >
                <svg className="acx-theme-icon-light" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
                  <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
                  <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
                  <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
                </svg>
                <svg className="acx-theme-icon-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3c0 0 0 0 0 0A7 7 0 0 0 21 12.79z" />
                </svg>
                <svg className="acx-theme-icon-system" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <line x1="8" y1="20" x2="16" y2="20" />
                  <line x1="12" y1="16" x2="12" y2="20" />
                </svg>
              </button>
            </div>

            {/* Desktop Browse Button */}
            <Link
              href="/agents"
              className={`hidden md:block ${browseClass} rounded-[var(--acx-radius-sm)] px-4 py-2 text-sm font-semibold transition-colors`}
            >
              Browse Agents
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg acx-body acx-btn-ghost"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                // X icon
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                // Hamburger icon
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t acx-divider py-4 space-y-1 acx-reveal">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                data-active={isActive(link.href)}
                className="block px-4 py-3 acx-nav-link rounded-lg text-sm font-medium acx-btn-ghost"
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 py-2">
              <p className="text-xs acx-muted mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setThemePref('light')
                    setMenuOpen(false)
                  }}
                  data-theme-pref-option="light"
                  className="acx-theme-choice border acx-divider rounded-lg px-2 py-2 text-xs font-medium acx-btn-ghost"
                >
                  Light
                </button>
                <button
                  onClick={() => {
                    setThemePref('dark')
                    setMenuOpen(false)
                  }}
                  data-theme-pref-option="dark"
                  className="acx-theme-choice border acx-divider rounded-lg px-2 py-2 text-xs font-medium acx-btn-ghost"
                >
                  Dark
                </button>
                <button
                  onClick={() => {
                    setThemePref('system')
                    setMenuOpen(false)
                  }}
                  data-theme-pref-option="system"
                  className="acx-theme-choice border acx-divider rounded-lg px-2 py-2 text-xs font-medium acx-btn-ghost"
                >
                  System
                </button>
              </div>
            </div>
            <div className="pt-2 px-4">
              <Link
                href="/agents"
                onClick={() => setMenuOpen(false)}
                className={`block w-full ${browseClass} rounded-[var(--acx-radius-sm)] px-4 py-3 text-center text-sm font-semibold transition-colors`}
              >
                Browse Agents
              </Link>
            </div>
          </div>
        )}

      </div>
    </nav>
  )
}
