'use client'

// app/(auth)/layout.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function UnauthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header authenticated={false} />
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      <Footer />
    </div>
  )
}