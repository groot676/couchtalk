'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ModeSelectPage() {
  const router = useRouter();
  const [hoveredMode, setHoveredMode] = useState<'solo' | 'couple' | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            How would you like to connect today?
          </h1>
          <p className="text-xl text-gray-600">
            Choose your therapy experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Solo Mode */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={() => setHoveredMode('solo')}
            onMouseLeave={() => setHoveredMode(null)}
            onClick={() => router.push('/chat')}
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100">
              <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6 group-hover:bg-gray-200 transition-colors">
                <User className="w-10 h-10 text-gray-700" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Solo Session
              </h2>
              
              <p className="text-gray-600 mb-6">
                Personal space for self-reflection and growth. Work through your thoughts with your AI therapist.
              </p>
              
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Private one-on-one conversation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Work at your own pace
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Focus on personal growth
                </li>
              </ul>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Start immediately</span>
                <ArrowRight className={`w-5 h-5 transition-transform ${hoveredMode === 'solo' ? 'translate-x-1' : ''}`} />
              </div>
            </div>
          </div>

          {/* Couple Mode */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={() => setHoveredMode('couple')}
            onMouseLeave={() => setHoveredMode(null)}
            onClick={() => router.push('/couple/start')}
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100">
              <div className="flex items-center justify-center w-20 h-20 bg-amber-50 rounded-full mb-6 group-hover:bg-amber-100 transition-colors">
                <Heart className="w-10 h-10 text-amber-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Couple&apos;s Session
              </h2>
              
              <p className="text-gray-600 mb-6">
                Connect with your partner in a guided conversation. Work through challenges together with AI mediation.
              </p>
              
              <ul className="space-y-2 text-sm text-gray-500 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Real-time shared conversation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  AI-mediated discussions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Build understanding together
                </li>
              </ul>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600 font-medium">NEW</span>
                <ArrowRight className={`w-5 h-5 transition-transform ${hoveredMode === 'couple' ? 'translate-x-1' : ''}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/chat" 
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Continue previous session →
          </Link>
        </div>
      </div>
    </main>
  );
}