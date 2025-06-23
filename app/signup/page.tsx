'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Brain, Mail, Lock, Loader2 } from 'lucide-react';
import { AtmosphereEffects } from '@/components/ui/AtmosphereEffects';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in. Check your inbox for the verification link.');
        } else {
          throw error;
        }
      } else {
        router.push('/mode-select');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      position: 'relative',
      backgroundColor: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <AtmosphereEffects />
      
      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}>
            <div style={{
              padding: '10px',
              background: 'rgba(255, 214, 165, 0.15)',
              borderRadius: '50%',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 214, 165, 0.2)',
            }}>
              <Brain style={{ width: '24px', height: '24px', color: '#FFD6A5' }} />
            </div>
            <h1 style={{
              fontSize: '32px',
              fontFamily: 'Crimson Text, serif',
              fontWeight: '400',
              color: '#FAFAF8',
              margin: 0,
            }}>
              Welcome back
            </h1>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
          }}>
            Continue your journey to wellness
          </p>
        </div>

        {/* Sign In Form */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px 32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              marginBottom: '20px',
              color: '#EF4444',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '24px',
              transition: 'all 0.2s ease',
              opacity: isGoogleLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isGoogleLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)',
            }} />
            <span style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '13px',
            }}>
              or
            </span>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)',
            }} />
          </div>

          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FAFAF8',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FAFAF8',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? 'rgba(255, 214, 165, 0.5)' : '#FFD6A5',
                color: '#1A1A1A',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFC98B';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 214, 165, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFD6A5';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            textAlign: 'center',
          }}>
            <Link 
              href="/forgot-password"
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFD6A5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
            >
              Forgot password?
            </Link>
          </div>

          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
          }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{
              color: '#FFD6A5',
              textDecoration: 'none',
              fontWeight: '500',
            }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}