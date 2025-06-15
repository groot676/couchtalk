'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Users, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function CoupleStartPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate a random session code
  const generateSessionCode = () => {
    const adjectives = ['COZY', 'WARM', 'CALM', 'SAFE', 'KIND', 'WISE'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${randomAdj}-${randomNum}`;
  };

  // Create a new couple's session
  const handleCreateSession = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const code = generateSessionCode();

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          mode: 'couple'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create couple_sessions entry
      const { error: coupleError } = await supabase
        .from('couple_sessions')
        .insert({
          session_id: session.id,
          partner1_id: user.id,
          partner2_id: null,
          session_code: code,
          status: 'waiting'
        });

      if (coupleError) throw coupleError;

      setSessionCode(code);
      setSessionId(session.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Join an existing session
  const handleJoinSession = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Trying to join with code:', joinCode);

      // Find the couple session
      const { data: coupleSession, error: findError } = await supabase
        .from('couple_sessions')
        .select('*')
        .eq('session_code', joinCode)
        .eq('status', 'waiting')
        .single();

      console.log('Found session:', coupleSession);
      console.log('Find error:', findError);

      if (findError || !coupleSession) {
        throw new Error('Invalid or expired session code');
      }

      // Make sure user isn't trying to join their own session
      if (coupleSession.partner1_id === user.id) {
        throw new Error('You cannot join your own session');
      }

      // Update the session with partner2
      const { error: updateError } = await supabase
        .from('couple_sessions')
        .update({
          partner2_id: user.id,
          status: 'active'
        })
        .eq('id', coupleSession.id);

      console.log('Update result:', { updateError });
      
      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      alert('Successfully joined! Redirecting...');

      // Redirect to couple's chat
      router.push(`/couple/chat/${coupleSession.session_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {

      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-6 mx-auto">
            <Users className="w-8 h-8 text-amber-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Couple&apos;s Session
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Connect with your partner for a guided conversation
          </p>

          {!sessionCode ? (
            <>
              {/* Mode Toggle */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('create')}
                  className={`flex-1 py-2 px-4 rounded-md transition-all ${
                    mode === 'create'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Start New
                </button>
                <button
                  onClick={() => setMode('join')}
                  className={`flex-1 py-2 px-4 rounded-md transition-all ${
                    mode === 'join'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Join Existing
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {mode === 'create' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Start a new session and invite your partner to join with a unique code.
                  </p>
                  <button
                    onClick={handleCreateSession}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-black transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating Session...' : 'Create Session'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter the session code shared by your partner.
                  </p>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter code (e.g., COZY-1234)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    maxLength={10}
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={loading || !joinCode}
                    className="w-full py-3 px-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-black transition-all disabled:opacity-50"
                  >
                    {loading ? 'Joining...' : 'Join Session'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <p className="text-sm text-amber-800 mb-3">Your session code:</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-3xl font-bold text-amber-900">{sessionCode}</p>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-amber-700" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Share this code with your partner. Once they join, you&apos;ll both be connected to the same session.
                </p>
                
                <button
                  onClick={() => router.push(`/couple/chat/${sessionId}`)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold rounded-lg hover:from-gray-900 hover:to-black transition-all"
                >
                  Enter Waiting Room
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/mode-select" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to mode selection
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}