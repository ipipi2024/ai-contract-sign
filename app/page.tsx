'use client'

// app/page.tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import Typewriter from 'typewriter-effect'

export default function Home() {
  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          DREAMSIGN.AI - MAIN PAGE TEST
        </h1>
        <p className="text-lg text-green-700 mb-4">
          If you can see this, the basic app is working!
        </p>
        <div className="space-y-2">
          <a 
            href="/open-external?url=https://www.dreamsign.ai" 
            className="block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Test Open External Page
          </a>
          <a 
            href="/test-linkedin" 
            className="block bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
          >
            Test LinkedIn Page
          </a>
        </div>
      </div>
    </div>
  );
}
