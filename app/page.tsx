'use client'

// app/page.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import Typewriter from 'typewriter-effect'

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
        <div className="bg-white border-b border-gray-200 min-h-[calc(100vh-4rem)] flex items-center justify-center relative overflow-hidden">
          <style jsx>{`
            @keyframes gentle-float {
              0%, 100% { transform: translateY(0px) rotate(12deg); }
              50% { transform: translateY(-20px) rotate(12deg); }
            }
            @keyframes gentle-float-reverse {
              0%, 100% { transform: translateY(0px) rotate(-6deg); }
              50% { transform: translateY(-15px) rotate(-6deg); }
            }
            @keyframes gentle-float-small {
              0%, 100% { transform: translateY(0px) rotate(3deg); }
              50% { transform: translateY(-12px) rotate(3deg); }
            }
            @keyframes gentle-float-ds {
              0%, 100% { transform: translateY(0px) rotate(12deg); }
              50% { transform: translateY(-18px) rotate(12deg); }
            }
            @keyframes mobile-float-1 {
              0%, 100% { transform: translateY(0px) rotate(8deg); }
              50% { transform: translateY(-15px) rotate(8deg); }
            }
            @keyframes mobile-float-2 {
              0%, 100% { transform: translateY(0px) rotate(-5deg); }
              50% { transform: translateY(-12px) rotate(-5deg); }
            }
            @keyframes mobile-float-3 {
              0%, 100% { transform: translateY(0px) rotate(3deg); }
              50% { transform: translateY(-10px) rotate(3deg); }
            }
            .float-1 { animation: gentle-float 12s ease-in-out infinite; }
            .float-2 { animation: gentle-float-reverse 14s ease-in-out infinite 1s; }
            .float-3 { animation: gentle-float-small 13s ease-in-out infinite 2s; }
            .float-4 { animation: gentle-float 15s ease-in-out infinite 0.5s; }
            .float-5 { animation: gentle-float-reverse 11s ease-in-out infinite 1.5s; }
            .float-6 { animation: gentle-float-ds 16s ease-in-out infinite 0.8s; }
            .mobile-float-1 { animation: mobile-float-1 10s ease-in-out infinite; }
            .mobile-float-2 { animation: mobile-float-2 12s ease-in-out infinite 1s; }
            .mobile-float-3 { animation: mobile-float-3 11s ease-in-out infinite 2s; }
          `}</style>
          
          {/* Animated 3D Background - Hidden on Mobile */}
          <div className="absolute inset-0 overflow-hidden hidden md:block">
            {/* Floating Contract Documents */}
            <div className="absolute top-20 left-10 float-1">
              <div className="w-16 h-20 bg-gray-100 rounded shadow-lg border border-gray-200">
                <div className="w-full h-2 bg-gray-300 rounded-t"></div>
                <div className="p-2 space-y-1">
                  <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-1 bg-gray-300 rounded w-full"></div>
                  <div className="h-1 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute top-32 right-20 float-2">
              <div className="w-20 h-24 bg-gray-50 rounded shadow-lg border border-gray-200">
                <div className="w-full h-2 bg-gray-300 rounded-t"></div>
                <div className="p-3 space-y-1">
                  <div className="h-1 bg-gray-300 rounded w-full"></div>
                  <div className="h-1 bg-gray-300 rounded w-4/5"></div>
                  <div className="h-1 bg-gray-300 rounded w-full"></div>
                  <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-32 left-1/4 float-3">
              <div className="w-14 h-18 bg-white rounded shadow-lg border border-gray-200">
                <div className="w-full h-2 bg-gray-300 rounded-t"></div>
                <div className="p-2 space-y-1">
                  <div className="h-1 bg-gray-300 rounded w-full"></div>
                  <div className="h-1 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* Floating Signatures */}
            <div className="absolute top-20 right-1/3 float-4">
              <div className="w-12 h-8 bg-yellow-50 rounded shadow-md border border-yellow-200">
                <div className="p-1 flex items-center justify-center h-full">
                  <svg className="w-full h-full text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-1/4 right-1/4 float-5">
              <div className="w-10 h-6 bg-green-50 rounded shadow-md border border-green-200">
                <div className="p-1 flex items-center justify-center h-full">
                  <svg className="w-full h-full text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* D.S. Initials */}
            <div className="absolute top-1/2 left-1/6 float-6">
              <div className="w-12 h-8 bg-red-50 rounded shadow-md border border-red-200">
                <div className="p-1 flex items-center justify-center h-full">
                  <span className="text-red-600 font-serif italic text-sm font-bold" style={{fontFamily: 'cursive'}}>DS</span>
                </div>
              </div>
            </div>
            
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
          </div>

          {/* Mobile-Specific Icons - Only visible on mobile */}
          <div className="absolute inset-0 overflow-hidden md:hidden">
            {/* Top left - Small document */}
            <div className="absolute top-24 left-8 mobile-float-1">
              <div className="w-12 h-14 bg-gray-100 rounded shadow-md border border-gray-200">
                <div className="w-full h-1 bg-gray-300 rounded-t"></div>
                <div className="p-1 space-y-0.5">
                  <div className="h-0.5 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-0.5 bg-gray-300 rounded w-full"></div>
                  <div className="h-0.5 bg-gray-300 rounded w-5/6"></div>
                  <div className="h-0.5 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* Top right - Signature */}
            <div className="absolute top-20 right-8 mobile-float-2">
              <div className="w-8 h-6 bg-yellow-50 rounded shadow-md border border-yellow-200">
                <div className="p-1 flex items-center justify-center h-full">
                  <svg className="w-full h-full text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Bottom left - Checkmark */}
            <div className="absolute bottom-32 left-8 mobile-float-3">
              <div className="w-6 h-4 bg-green-50 rounded shadow-md border border-green-200">
                <div className="p-0.5 flex items-center justify-center h-full">
                  <svg className="w-full h-full text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom right - DS initials */}
            <div className="absolute bottom-36 right-8 mobile-float-1">
              <div className="w-7 h-5 bg-red-50 rounded shadow-md border border-red-200">
                <div className="p-0.5 flex items-center justify-center h-full">
                  <span className="text-red-600 font-serif italic text-xs font-bold" style={{fontFamily: 'cursive'}}>DS</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 relative z-10">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 md:mb-10">
                <Typewriter
                  onInit={(typewriter) => {
                    typewriter
                      .typeString('Generate. Sign. Send.')
                      .pauseFor(2000)
                      .callFunction(() => {
                        // Remove cursor after 2 seconds
                        const cursor = document.querySelector('.Typewriter__cursor') as HTMLElement;
                        if (cursor) {
                          cursor.style.display = 'none';
                        }
                      })
                      .start();
                  }}
                  options={{
                    delay: 100,
                    cursor: '|',
                  }}
                />
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8 md:mb-[4rem] justify-center">
                <Link
                  href="/contracts/new"
                  className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white rounded-md hover:bg-blue-800 transition-colors font-semibold text-sm md:text-md"
                >
                  Create Your First Contract
                </Link>
                <Link
                  href="/dashboard"
                  className="px-6 md:px-8 py-3 md:py-4 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold text-md"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Why Choose DreamSign?
              </h2>
              <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                Our AI-powered platform rolls contract creation and eSignature into one simple, fast, and reliable experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 hidden md:flex">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">Lightning Fast</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Generate comprehensive contracts in minutes, not hours, with our frictionless agentic workflow. 
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 hidden md:flex">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">Legally Binding</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  All contracts ensure proper legal structure to protect your interests and employ cyrptography to securely create eSignatures.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 hidden md:flex">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">Fully Customizable</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Tailor every contract to your specific needs with custom clauses and requirements entered manually or generated by our AI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-50 py-12 md:py-30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-black mb-1 md:mb-2">10,000+</div>
                <div className="text-gray-600 text-sm md:text-base">Contracts Generated</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1 md:mb-2">95%</div>
                <div className="text-gray-600 text-sm md:text-base">Time Saved</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1 md:mb-2">24/7</div>
                <div className="text-gray-600 text-sm md:text-base">AI Availability</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">1 Min</div>
                <div className="text-gray-600 text-sm md:text-base">Average Generation Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Types Section */}
        <div className="bg-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Supported Contract Types
              </h2>
              <p className="text-gray-600 text-base md:text-lg">
                Create any type of contract with our comprehensive AI system
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[
                { name: 'Service Agreement', desc: 'Professional service contracts with payment terms and deliverables' },
                { name: 'Non-Disclosure Agreement', desc: 'Protect confidential information and trade secrets' },
                { name: 'Employment Contract', desc: 'Comprehensive employment terms and conditions' },
                { name: 'Lease Agreement', desc: 'Residential and commercial property leases' },
                { name: 'Partnership Agreement', desc: 'Business partnership terms and profit sharing' },
                { name: 'Custom Contract', desc: 'Any other type of legal agreement you need' }
              ].map((contract, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2 text-base md:text-lg">{contract.name}</h3>
                  <p className="text-gray-600 text-sm md:text-base">{contract.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-6 md:mt-8">
              <Link
                href="/contracts/new"
                className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-800 transition-colors font-semibold text-sm md:text-base"
              >
                Start Creating
                <svg className="ml-2 w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        
{/* 
        CTA Section
        <div className="bg-black py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Create Your Contract?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Join thousands of professionals who trust DreamSign for their contract needs
            </p>
            <Link
              href="/contracts/new"
              className="inline-block px-8 py-4 bg-white text-black rounded-md hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              Get Started Now
            </Link>
          </div>
        </div> */}

        {/* Newsletter Section */}
        <div className="bg-white py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Stay Updated with DreamSign
            </h2>
            <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
              Get the latest updates on new features, legal insights, and contract templates
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-sm md:text-base"
                required
              />
              <button
                type="submit"
                className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-800 transition-colors font-semibold text-sm md:text-base"
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
