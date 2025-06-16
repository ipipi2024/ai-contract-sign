// components/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">© 2025 DreamSign</span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <Link href="/help" className="hover:text-gray-700 transition-colors">
              Help
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}