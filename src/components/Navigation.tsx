import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              Agent<span className="text-blue-600">Codex</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/agents" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              All Agents
            </Link>
            <Link 
              href="/categories" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Categories
            </Link>
            <Link 
              href="/compare" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Compare
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Link
              href="/agents"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Agents
            </Link>
          </div>

        </div>
      </div>
    </nav>
  )
}