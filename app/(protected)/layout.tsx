'use client'

// app/(root)/layout.tsx
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header authenticated={true} />
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      <Footer />
    </div>
  )
}