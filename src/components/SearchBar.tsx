'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type SearchOption = {
  slug: string
  name: string
  provider: string
}

type Props = {
  options: SearchOption[]
}

const MAX_SUGGESTIONS = 7

export default function SearchBar({ options }: Props) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const normalized = query.trim().toLowerCase()
  const suggestions = useMemo(() => {
    if (!normalized) return []
    return options
      .filter((option) => (
        option.name.toLowerCase().includes(normalized) ||
        option.provider.toLowerCase().includes(normalized)
      ))
      .slice(0, MAX_SUGGESTIONS)
  }, [normalized, options])

  const hasSuggestions = suggestions.length > 0

  const submitSearch = () => {
    if (!query.trim()) return
    router.push(`/agents?search=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  const navigateToAgent = (slug: string) => {
    router.push(`/agents/${slug}`)
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !hasSuggestions) {
      if (event.key === 'Enter') {
        event.preventDefault()
        submitSearch()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        navigateToAgent(suggestions[activeIndex].slug)
      } else {
        submitSearch()
      }
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          navigateToAgent(suggestions[activeIndex].slug)
          return
        }
        submitSearch()
      }}
      className="w-full"
    >
      <div className="relative">
        <input
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 120)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search agents... try Claude, Copilot, Cursor"
          className="w-full px-5 py-4 text-lg acx-input pr-32"
          aria-label="Search agents"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="agent-search-suggestions"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 acx-btn-primary px-6"
        >
          Search
        </button>

        {open && query.trim().length > 0 && (
          <div
            id="agent-search-suggestions"
            className="absolute z-30 mt-2 w-full acx-panel overflow-hidden shadow-lg"
          >
            {hasSuggestions ? (
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={suggestion.slug}>
                    <button
                      type="button"
                      onMouseDown={() => navigateToAgent(suggestion.slug)}
                      className={`w-full text-left px-4 py-3 border-b acx-divider last:border-b-0 ${
                        index === activeIndex
                          ? 'bg-[var(--acx-accent-soft)]'
                          : 'hover:bg-[var(--acx-elevated-soft)]'
                      }`}
                    >
                      <span className="block text-sm font-medium text-[var(--acx-text)]">
                        {suggestion.name}
                      </span>
                      <span className="block text-xs acx-muted mt-0.5">
                        {suggestion.provider}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onMouseDown={submitSearch}
                className="w-full text-left px-4 py-3 hover:bg-[var(--acx-elevated-soft)]"
              >
                <span className="block text-sm text-[var(--acx-text)]">
                  No exact match. Search for “{query.trim()}”
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
