'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/agents?search=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agents... try Claude, Copilot, Cursor"
          className="w-full px-6 py-4 text-lg acx-input shadow-sm pr-32"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 acx-btn-primary px-6 rounded-xl"
        >
          Search
        </button>
      </div>
    </form>
  )
}
