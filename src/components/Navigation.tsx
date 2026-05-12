'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme')
    const fallback = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const active = current === 'dark' || current === 'light' ? current : fallback
    const next = active === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('acx-theme', next)
  }

  return (
    <nav className="border-b acx-divider bg-[var(--acx-surface)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              Agent<span className="text-blue-600">Codex</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/radar"
              className="acx-body hover:text-[var(--acx-text)] font-medium transition-colors"
            >
              Radar
            </Link>
            <Link
              href="/agents"
              className="acx-body hover:text-[var(--acx-text)] font-medium transition-colors"
            >
              All Agents
            </Link>
            <Link
              href="/categories"
              className="acx-body hover:text-[var(--acx-text)] font-medium transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/compare"
              className="acx-body hover:text-[var(--acx-text)] font-medium transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/copilot"
              className="acx-body hover:text-[var(--acx-text)] font-medium transition-colors"
            >
              Copilot
            </Link>
            <Link
              href="/methodology"
              className="acx-body hover:text-[var(--acx-text)] font-medium transition-colors"
            >
              Methodology
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              title="Toggle color theme"
              className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-lg border acx-divider acx-body hover:bg-gray-100 transition-colors"
            >
              <svg className="acx-theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg className="acx-theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3c0 0 0 0 0 0A7 7 0 0 0 21 12.79z" />
              </svg>
            </button>

            {/* Desktop Browse Button */}
            <Link
              href="/agents"
              className="hidden md:block acx-btn-primary px-4 py-2 text-sm"
            >
              Browse Agents
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg acx-body hover:bg-gray-100 transition-colors"
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
          <div className="md:hidden border-t acx-divider py-4 space-y-1">
            <Link
              href="/radar"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 acx-body hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Radar
            </Link>
            <Link
              href="/agents"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 acx-body hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              All Agents
            </Link>
            <Link
              href="/categories"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 acx-body hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/compare"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 acx-body hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/copilot"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 acx-body hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Copilot
            </Link>
            <Link
              href="/methodology"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 acx-body hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Methodology
            </Link>
            <button
              onClick={() => {
                toggleTheme()
                setMenuOpen(false)
              }}
              className="w-full text-left px-4 py-3 acx-body hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Toggle theme
            </button>
            <div className="pt-2 px-4">
              <Link
                href="/agents"
                onClick={() => setMenuOpen(false)}
                className="block w-full acx-btn-primary px-4 py-3 text-sm text-center"
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
