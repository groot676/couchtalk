'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export default function SignUpPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Email & Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Step 2: Profile Info
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [reason, setReason] = useState('');

  // Initialize Supabase client on mount
  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Check auth status after supabase is initialized
  useEffect(() => {
    if (!supabase) return;
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.user_metadata?.profile_completed) {
        setStep(2);
      } else if (user && user.user_metadata?.profile_completed) {
        router.push('/mode-select');
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        setError('Please check your email to confirm your account. After confirming, come back and sign in.');
        setLoading(false);
        return;
      }
      
      if (data.session) {
        // User is signed in, proceed to step 2
        setStep(2);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name,
          pronouns: pronouns || null,
          onboarding_reason: reason,
        });

      if (profileError) throw profileError;

      // Set up encryption for the new user
      console.log('Setting up encryption for new user...');
      try {
        const response = await fetch('/api/ensure-encryption', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Encryption setup result:', result);
        }
      } catch (encryptionError) {
        console.error('Error setting up encryption:', encryptionError);
        // Don't block sign up if encryption setup fails
      }

      router.push('/mode-select');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Begin Your Journey' : 'Tell Us About You'}
          </h1>
          <p className="text-gray-600 mb-8">
            {step === 1 
              ? 'Create your account to start your therapy journey'
              : 'Help us personalize your experience'
            }
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleEmailSignUp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading || !supabase}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleProfileSetup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pronouns (optional)
                </label>
                <input
                  type="text"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., they/them"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What brings you to CouchTalk?
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an option</option>
                  <option value="anxiety">Anxiety & Stress</option>
                  <option value="relationship">Relationship Support</option>
                  <option value="growth">Personal Growth</option>
                  <option value="talk">Just Need Someone to Talk To</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !supabase}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Start Chatting'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
              >
                Back
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/signin" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}