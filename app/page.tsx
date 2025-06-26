'use client'

// app/page.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Newsletter signup logic would go here
    console.log('Newsletter signup:', email)
    setEmail('')
    alert('Thank you for subscribing to DreamSign updates!')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header authenticated={isAuthenticated} />
      
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white border-b border-gray-200  flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-10 mt-20">
                Generate. Sign. Send.
              </h1>
              
              <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">
                Professional contracts generated and sent for e-signature in minutes through an agentic contract generation flow.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-[4rem] justify-center">
                <Link
                  href="/contracts/new"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-semibold text-md"
                >
                  Create Your First Contract
                </Link>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 text-black bg-blue-50 rounded-md hover:bg-blue-100 transition-colors font-semibold text-md"
                >
                  View Dashboard
                </Link>
              </div>

              {/*  */}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose DreamSign?
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Our AI-powered platform makes contract creation simple, fast, and reliable
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
                <p className="text-gray-600">
                  Generate comprehensive contracts in minutes, not hours. Our AI understands legal requirements and creates professional documents instantly.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Legally Sound</h3>
                <p className="text-gray-600">
                  All contracts include standard legal clauses, dispute resolution terms, and proper legal structure to protect your interests.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Fully Customizable</h3>
                <p className="text-gray-600">
                  Tailor every contract to your specific needs with custom clauses, terms, and requirements. Perfect for any industry or use case.
                </p>
              </div>  
            </div>
          </div>
        </div>

        {/* Contract Types Section */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Supported Contract Types
              </h2>
              <p className="text-gray-600 text-lg">
                Create any type of contract with our comprehensive AI system
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Service Agreement', desc: 'Professional service contracts with payment terms and deliverables' },
                { name: 'Non-Disclosure Agreement', desc: 'Protect confidential information and trade secrets' },
                { name: 'Employment Contract', desc: 'Comprehensive employment terms and conditions' },
                { name: 'Lease Agreement', desc: 'Residential and commercial property leases' },
                { name: 'Partnership Agreement', desc: 'Business partnership terms and profit sharing' },
                { name: 'Custom Contract', desc: 'Any other type of legal agreement you need' }
              ].map((contract, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{contract.name}</h3>
                  <p className="text-gray-600 text-sm">{contract.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/contracts/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                Start Creating
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
                <div className="text-gray-600">Contracts Generated</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
                <div className="text-gray-600">Time Saved</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600">AI Availability</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">5 Min</div>
                <div className="text-gray-600">Average Generation Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Create Your Contract?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Join thousands of professionals who trust DreamSign for their contract needs
            </p>
            <Link
              href="/contracts/new"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              Get Started Now
            </Link>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Stay Updated with DreamSign
            </h2>
            <p className="text-gray-600 mb-8">
              Get the latest updates on new features, legal insights, and contract templates
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}