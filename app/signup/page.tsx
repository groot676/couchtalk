'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { ChevronLeft } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setSupabase(createClient());
    setIsLoaded(true);
  }, []);

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
      
      if (data.user && !data.session) {
        setError('Please check your email to confirm your account.');
        setLoading(false);
        return;
      }
      
      if (data.session) {
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

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name,
          pronouns: pronouns || null,
          onboarding_reason: reason,
        });

      if (profileError) throw profileError;

      try {
        await fetch('/api/ensure-encryption', { method: 'POST' });
      } catch (encryptionError) {
        console.error('Error setting up encryption:', encryptionError);
      }

      router.push('/mode-select');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#1A1A1A' }}>
      {/* Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        backgroundImage: 'url("/images/therapy-room.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(2px) brightness(0.85)',
        transform: 'scale(1.05)',
      }}>
        <div style={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)',
        }} />
      </div>

      {/* Lighting Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(255, 220, 180, 0.15) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 40%, rgba(255, 200, 150, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(0, 0, 0, 0.4) 0%, transparent 60%)
        `,
      }} />

      {/* Fireplace Glow */}
      <div className="fireplace-glow" style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse at center bottom, rgba(255, 140, 50, 0.3) 0%, transparent 70%)',
        zIndex: 3,
        animation: 'flicker 3s ease-in-out infinite',
      }} />

      {/* Candle Lights */}
      <div style={{
        position: 'fixed',
        top: '40%',
        right: '20%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255, 200, 100, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'candleFlicker 4s ease-in-out infinite',
        zIndex: 4,
      }} />
      <div style={{
        position: 'fixed',
        bottom: '30%',
        left: '15%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255, 200, 100, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'candleFlicker 4s ease-in-out infinite',
        animationDelay: '1s',
        zIndex: 4,
      }} />

      {/* Dust Particles */}
      {[0, 4, 8, 12, 16].map((delay, i) => (
        <div key={i} style={{
          position: 'fixed',
          width: '2px',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          animation: `float 20s linear infinite`,
          animationDelay: `${delay}s`,
          left: `${10 + i * 20}%`,
          zIndex: 5,
        }} />
      ))}

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 1s ease-in',
      }}>
        <div className="w-full max-w-md">
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            padding: '48px 40px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}>
            <div className="text-center" style={{ marginBottom: '40px' }}>
              <h1 style={{ 
                fontSize: '42px',
                fontFamily: 'Crimson Text, serif',
                fontWeight: '400',
                color: '#FAFAF8',
                marginBottom: '12px',
                textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
                lineHeight: '1.15',
              }}>
                {step === 1 ? (
                  <>Begin your journey to <span style={{ color: '#FFD6A5', fontStyle: 'italic' }}>healing</span></>
                ) : (
                  <>Tell us about <span style={{ color: '#FFD6A5', fontStyle: 'italic' }}>you</span></>
                )}
              </h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                fontWeight: '300',
                lineHeight: '1.5',
                margin: 0,
              }}>
                {step === 1 
                  ? 'Create your account to start your therapy journey'
                  : 'Help us personalize your experience'
                }
              </p>
            </div>

            {error && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
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

            {step === 1 ? (
              <form onSubmit={handleEmailSignUp} style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '8px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      color: '#FAFAF8',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      backdropFilter: 'blur(10px)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '8px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      color: '#FAFAF8',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      backdropFilter: 'blur(10px)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    At least 6 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !supabase}
                  style={{
                    width: '100%',
                    backgroundColor: loading ? 'rgba(255, 214, 165, 0.6)' : '#FFD6A5',
                    color: '#1A1A1A',
                    padding: '14px 28px',
                    borderRadius: '25px',
                    fontWeight: '600',
                    fontSize: '15px',
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
                  {loading ? 'Creating Account...' : 'Continue'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleProfileSetup} style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '8px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}>
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      color: '#FAFAF8',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      backdropFilter: 'blur(10px)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '8px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}>
                    Pronouns (optional)
                  </label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      color: '#FAFAF8',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      backdropFilter: 'blur(10px)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    placeholder="e.g., they/them"
                  />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '8px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}>
                    What brings you to CouchTalk?
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      color: '#FAFAF8',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    required
                  >
                    <option value="" style={{ backgroundColor: '#1A1A1A' }}>Select an option</option>
                    <option value="anxiety" style={{ backgroundColor: '#1A1A1A' }}>Anxiety & Stress</option>
                    <option value="relationship" style={{ backgroundColor: '#1A1A1A' }}>Relationship Support</option>
                    <option value="growth" style={{ backgroundColor: '#1A1A1A' }}>Personal Growth</option>
                    <option value="talk" style={{ backgroundColor: '#1A1A1A' }}>Just Need Someone to Talk To</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={loading || !supabase}
                    style={{
                      width: '100%',
                      backgroundColor: loading ? 'rgba(255, 214, 165, 0.6)' : '#FFD6A5',
                      color: '#1A1A1A',
                      padding: '14px 28px',
                      borderRadius: '25px',
                      fontWeight: '600',
                      fontSize: '15px',
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
                    {loading ? 'Setting up...' : 'Start your sanctuary'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      padding: '12px 24px',
                      borderRadius: '25px',
                      fontWeight: '500',
                      fontSize: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <ChevronLeft style={{ width: '16px', height: '16px' }} />
                    Back
                  </button>
                </div>
              </form>
            )}

            <div className="text-center">
              <p style={{ 
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
              }}>
                Already have an account?{' '}
                <Link 
                  href="/signin" 
                  style={{ 
                    color: '#FFD6A5',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFC98B'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#FFD6A5'}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.9; transform: translateX(-50%) scale(1.05); }
        }
        
        @keyframes candleFlicker {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        @keyframes float {
          from {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          to {
            transform: translateY(-100vh) translateX(100px);
            opacity: 0;
          }
        }
        
        input::placeholder, select option[value=""] {
          color: rgba(255, 255, 255, 0.4);
        }
        
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23ffffff' fill-opacity='0.4' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }
      `}</style>
    </div>
  );
}