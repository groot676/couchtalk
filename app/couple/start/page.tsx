'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/ui/Header';
import { AtmosphereEffects } from '@/components/ui/AtmosphereEffects';
import { Users, Copy, Check, Heart, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { SupabaseClient } from '@supabase/supabase-js';

export default function CoupleStartPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSupabase(createClient());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/signin');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (profile?.name) {
        setUserName(profile.name);
      }
    };

    checkUser();
  }, [router, supabase]);

  const generateSessionCode = () => {
    const adjectives = ['COZY', 'WARM', 'CALM', 'SAFE', 'KIND', 'WISE'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${randomAdj}-${randomNum}`;
  };

  const handleCreateSession = async () => {
    if (!supabase) return;
    
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const code = generateSessionCode();

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          mode: 'couple'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

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

  const handleJoinSession = async () => {
    if (!supabase) return;
    
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: coupleSession, error: findError } = await supabase
        .from('couple_sessions')
        .select('*')
        .eq('session_code', joinCode)
        .eq('status', 'waiting')
        .single();

      if (findError || !coupleSession) {
        throw new Error('Invalid or expired session code');
      }

      if (coupleSession.partner1_id === user.id) {
        throw new Error('You cannot join your own session');
      }

      const { error: updateError } = await supabase
        .from('couple_sessions')
        .update({
          partner2_id: user.id,
          status: 'active'
        })
        .eq('id', coupleSession.id);
      
      if (updateError) throw updateError;

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
    <>
      <AtmosphereEffects />
      
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
          <Header userName={userName} />
        </div>
        
        <main style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1s ease-in',
        }}>
          <div className="w-full max-w-md">
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              padding: '40px 32px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}>
              <div className="text-center">
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(255, 240, 242, 0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 200, 200, 0.3)',
                }}>
                  <Heart style={{ width: '28px', height: '28px', color: '#FFB5B5' }} />
                </div>

                <h1 style={{ 
                  fontSize: '32px',
                  fontFamily: 'Crimson Text, serif',
                  fontWeight: '400',
                  color: '#FAFAF8',
                  marginBottom: '6px',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
                }}>
                  Couple's <span style={{ color: '#FFD6A5', fontStyle: 'italic' }}>sanctuary</span>
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '28px' }}>
                  Connect with your partner for a guided conversation
                </p>
              </div>

              {!sessionCode ? (
                <>
                  <div className="flex mb-6" style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '10px', 
                    padding: '3px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    <button
                      onClick={() => setMode('create')}
                      style={{
                        flex: 1,
                        padding: '7px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: mode === 'create' ? 'rgba(255, 214, 165, 0.2)' : 'transparent',
                        color: mode === 'create' ? '#FFD6A5' : 'rgba(255, 255, 255, 0.6)',
                        fontWeight: mode === 'create' ? '500' : '400',
                        fontSize: '13px',
                        backdropFilter: mode === 'create' ? 'blur(10px)' : 'none',
                      }}
                    >
                      Start New
                    </button>
                    <button
                      onClick={() => setMode('join')}
                      style={{
                        flex: 1,
                        padding: '7px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: mode === 'join' ? 'rgba(255, 214, 165, 0.2)' : 'transparent',
                        color: mode === 'join' ? '#FFD6A5' : 'rgba(255, 255, 255, 0.6)',
                        fontWeight: mode === 'join' ? '500' : '400',
                        fontSize: '13px',
                        backdropFilter: mode === 'join' ? 'blur(10px)' : 'none',
                      }}
                    >
                      Join Existing
                    </button>
                  </div>

                  {error && (
                    <div style={{
                      marginBottom: '16px',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(254, 202, 202, 0.1)',
                      border: '1px solid rgba(254, 202, 202, 0.3)',
                      borderRadius: '12px',
                      color: '#FCA5A5',
                      fontSize: '14px',
                      backdropFilter: 'blur(10px)',
                    }}>
                      {error}
                    </div>
                  )}

                  {mode === 'create' ? (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', marginBottom: '16px' }}>
                        Start a new session and invite your partner to join with a unique code.
                      </p>
                      <button
                        onClick={handleCreateSession}
                        disabled={loading || !supabase}
                        style={{
                          width: '100%',
                          backgroundColor: loading ? 'rgba(255, 214, 165, 0.6)' : '#FFD6A5',
                          color: '#1A1A1A',
                          padding: '12px 24px',
                          borderRadius: '22px',
                          fontWeight: '600',
                          fontSize: '14px',
                          border: 'none',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 5px 20px rgba(255, 214, 165, 0.3)',
                          opacity: loading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = '#FFC98B';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 214, 165, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.backgroundColor = '#FFD6A5';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 214, 165, 0.3)';
                          }
                        }}
                      >
                        {loading ? 'Creating Session...' : 'Create Session'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', marginBottom: '16px' }}>
                        Enter the session code shared by your partner.
                      </p>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Enter code (e.g., COZY-1234)"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                          color: '#FAFAF8',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          backdropFilter: 'blur(10px)',
                          marginBottom: '12px',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.5)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        maxLength={10}
                      />
                      <button
                        onClick={handleJoinSession}
                        disabled={loading || !joinCode || !supabase}
                        style={{
                          width: '100%',
                          backgroundColor: loading || !joinCode ? 'rgba(255, 214, 165, 0.6)' : '#FFD6A5',
                          color: '#1A1A1A',
                          padding: '12px 24px',
                          borderRadius: '22px',
                          fontWeight: '600',
                          fontSize: '14px',
                          border: 'none',
                          cursor: loading || !joinCode ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 5px 20px rgba(255, 214, 165, 0.3)',
                          opacity: loading || !joinCode ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!loading && joinCode) {
                            e.currentTarget.style.backgroundColor = '#FFC98B';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 214, 165, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading && joinCode) {
                            e.currentTarget.style.backgroundColor = '#FFD6A5';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 214, 165, 0.3)';
                          }
                        }}
                      >
                        {loading ? 'Joining...' : 'Join Session'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    background: 'rgba(255, 214, 165, 0.1)',
                    border: '1px solid rgba(255, 214, 165, 0.2)',
                    borderRadius: '14px',
                    padding: '20px',
                    backdropFilter: 'blur(10px)',
                    marginBottom: '20px',
                  }}>
                    <p style={{ fontSize: '13px', color: '#FFD6A5', marginBottom: '10px', textAlign: 'center' }}>
                      Your session code:
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <p style={{ 
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#FAFAF8',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      }}>
                        {sessionCode}
                      </p>
                      <button
                        onClick={copyToClipboard}
                        style={{
                          padding: '6px',
                          backgroundColor: copied ? 'rgba(107, 142, 127, 0.2)' : 'transparent',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          if (!copied) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          if (!copied) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {copied ? (
                          <Check style={{ width: '18px', height: '18px', color: '#6B8E7F' }} />
                        ) : (
                          <Copy style={{ width: '18px', height: '18px', color: '#FFD6A5' }} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', marginBottom: '16px' }}>
                      Share this code with your partner. Once they join, you'll both be connected to the same session.
                    </p>
                    
                    <button
                      onClick={() => router.push(`/couple/chat/${sessionId}`)}
                      style={{
                        width: '100%',
                        backgroundColor: '#FFD6A5',
                        color: '#1A1A1A',
                        padding: '12px 24px',
                        borderRadius: '22px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 5px 20px rgba(255, 214, 165, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFC98B';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 214, 165, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFD6A5';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 214, 165, 0.3)';
                      }}
                    >
                      Enter Waiting Room →
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link 
                  href="/mode-select" 
                  className="inline-flex items-center gap-2"
                  style={{ 
                    fontSize: '13px',
                    color: '#FFD6A5',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFC98B'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FFD6A5'}
                >
                  <ChevronLeft style={{ width: '14px', height: '14px' }} />
                  Back to mode selection
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </>
  );
}