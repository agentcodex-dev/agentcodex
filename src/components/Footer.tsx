import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          <Link href="/" className="font-bold text-gray-900">
            Agent<span className="text-blue-600">Codex</span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">
              Contact
            </Link>
          </div>

          <span className="text-sm text-gray-500">
            © {new Date().getFullYear()} AgentCodex. All rights reserved.
          </span>

        </div>
      </div>
    </footer>
  )
}