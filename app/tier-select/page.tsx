'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Zap, Check, Loader2, Brain } from 'lucide-react';
import { Header } from '@/components/ui/Header';

export default function TierSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'solo';
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  // Get user name on mount
  useState(() => {
    const getUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profile?.name) {
          setUserName(profile.name);
        }
      }
      setIsLoaded(true);
    };
    getUserName();
  });

  const handleContinue = async () => {
    if (!selectedTier) return;
    
    setIsLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
        return;
      }

      // Update user's subscription tier
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          subscription_tier: selectedTier,
          monthly_message_count: 0,
          message_reset_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating tier:', error);
        return;
      }

      // Navigate to appropriate chat
      if (mode === 'couple') {
        router.push('/couple/start');
      } else {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#1A1A1A' }}>
      {/* Background Elements - Same as mode-select */}
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
        top: '35%',
        right: '15%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255, 200, 100, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'candleFlicker 4s ease-in-out infinite',
        zIndex: 4,
      }} />
      <div style={{
        position: 'fixed',
        bottom: '25%',
        left: '10%',
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

      {/* Header with glass morphism */}
      <div style={{ position: 'relative', zIndex: 10 }}>
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
        paddingTop: '60px',
        minHeight: 'calc(100vh - 72px)',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 1s ease-in',
      }}>
        <div className="max-w-5xl w-full">
          <div className="text-center animate-slide-up" style={{ marginBottom: '48px' }}>
            <h1 
              style={{ 
                fontSize: '56px',
                fontFamily: 'Crimson Text, serif',
                fontWeight: '400',
                color: '#FAFAF8',
                marginBottom: '12px',
                letterSpacing: '-0.01em',
                textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
                lineHeight: '1.1',
              }}
            >
              Choose your <span style={{ color: '#FFD6A5', fontStyle: 'italic' }}>experience</span>
            </h1>
            <p 
              style={{ 
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '300',
                letterSpacing: '0.01em',
              }}
            >
              Select the plan that best fits your therapy journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Tier Card */}
            <div 
              className="animate-slide-up group"
              style={{
                background: selectedTier === 'free' 
                  ? 'rgba(255, 214, 165, 0.08)' 
                  : 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '36px 32px',
                border: selectedTier === 'free'
                  ? '2px solid rgba(255, 214, 165, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (selectedTier !== 'free') {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.2)';
                }
                const line = e.currentTarget.querySelector('.hover-line') as HTMLElement;
                if (line) line.style.transform = 'scaleX(1)';
              }}
              onMouseLeave={(e) => {
                if (selectedTier !== 'free') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
                const line = e.currentTarget.querySelector('.hover-line') as HTMLElement;
                if (line) line.style.transform = 'scaleX(0)';
              }}
              onClick={() => setSelectedTier('free')}
            >
              <div 
                className="hover-line"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(to right, #6B8E7F, #7FA594)',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.3s ease',
                }}
              />
              
              {selectedTier === 'free' && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '28px',
                  height: '28px',
                  background: '#FFD6A5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check style={{ width: '16px', height: '16px', color: '#1A1A1A' }} />
                </div>
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'rgba(107, 142, 127, 0.15)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(107, 142, 127, 0.3)',
                    }}
                  >
                    <Sparkles style={{ width: '30px', height: '30px', color: '#6B8E7F' }} />
                  </div>

                  <h2 
                    style={{ 
                      fontSize: '32px',
                      fontFamily: 'Crimson Text, serif',
                      fontWeight: '400',
                      color: '#FAFAF8',
                      marginBottom: '12px',
                    }}
                  >
                    Free Tier
                  </h2>
                  
                  <p 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      marginBottom: '24px',
                      fontWeight: '300',
                    }}
                  >
                    Begin your journey with our thoughtful AI companion
                  </p>
                </div>

                <div style={{
                  fontSize: '36px',
                  fontWeight: '400',
                  color: '#FAFAF8',
                  marginBottom: '28px',
                  textAlign: 'center',
                  fontFamily: 'Crimson Text, serif',
                }}>
                  $0<span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}> / month</span>
                </div>
                
                <ul style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 28px 0',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: '300',
                }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ color: '#6B8E7F', fontSize: '16px' }}>✓</span>
                    50 messages per month
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ color: '#6B8E7F', fontSize: '16px' }}>✓</span>
                    Llama 3.3 70B model
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ color: '#6B8E7F', fontSize: '16px' }}>✓</span>
                    Solo & couples therapy
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#6B8E7F', fontSize: '16px' }}>✓</span>
                    End-to-end encryption
                  </li>
                </ul>
              </div>
            </div>

            {/* Premium Tier Card */}
            <div 
              className="animate-slide-up group"
              style={{
                background: selectedTier === 'premium' 
                  ? 'rgba(255, 214, 165, 0.08)' 
                  : 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '36px 32px',
                border: selectedTier === 'premium'
                  ? '2px solid rgba(255, 214, 165, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                animationDelay: '100ms',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (selectedTier !== 'premium') {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.2)';
                }
                const line = e.currentTarget.querySelector('.hover-line') as HTMLElement;
                if (line) line.style.transform = 'scaleX(1)';
              }}
              onMouseLeave={(e) => {
                if (selectedTier !== 'premium') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
                const line = e.currentTarget.querySelector('.hover-line') as HTMLElement;
                if (line) line.style.transform = 'scaleX(0)';
              }}
              onClick={() => setSelectedTier('premium')}
            >
              <div 
                className="hover-line"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(to right, #FFD6A5, #FFC98B)',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.3s ease',
                }}
              />

              <span 
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  backgroundColor: '#FFD6A5',
                  color: '#1A1A1A',
                  padding: '5px 14px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                }}
              >
                RECOMMENDED
              </span>

              {selectedTier === 'premium' && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  width: '28px',
                  height: '28px',
                  background: '#FFD6A5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check style={{ width: '16px', height: '16px', color: '#1A1A1A' }} />
                </div>
              )}
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'rgba(255, 214, 165, 0.15)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 214, 165, 0.3)',
                    }}
                  >
                    <Zap style={{ width: '30px', height: '30px', color: '#FFD6A5' }} />
                  </div>

                  <h2 
                    style={{ 
                      fontSize: '32px',
                      fontFamily: 'Crimson Text, serif',
                      fontWeight: '400',
                      color: '#FAFAF8',
                      marginBottom: '12px',
                    }}
                  >
                    Premium
                  </h2>
                  
                  <p 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      marginBottom: '24px',
                      fontWeight: '300',
                    }}
                  >
                    Experience the full depth of AI-powered therapy
                  </p>
                </div>

                <div style={{
                  fontSize: '36px',
                  fontWeight: '400',
                  color: '#FAFAF8',
                  marginBottom: '28px',
                  textAlign: 'center',
                  fontFamily: 'Crimson Text, serif',
                }}>
                  $29<span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}> / month</span>
                </div>
                
                <ul style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 28px 0',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: '300',
                }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ color: '#FFD6A5', fontSize: '16px' }}>✓</span>
                    Unlimited messages
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ color: '#FFD6A5', fontSize: '16px' }}>✓</span>
                    GPT-4 Turbo (most advanced)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ color: '#FFD6A5', fontSize: '16px' }}>✓</span>
                    Voice notes (coming soon)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#FFD6A5', fontSize: '16px' }}>✓</span>
                    Session history & export (coming soon)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              onClick={handleContinue}
              disabled={!selectedTier || isLoading}
              style={{
                backgroundColor: selectedTier ? '#FFD6A5' : 'rgba(255, 214, 165, 0.3)',
                color: '#1A1A1A',
                padding: '16px 48px',
                borderRadius: '25px',
                fontWeight: '600',
                border: 'none',
                cursor: selectedTier && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                fontSize: '16px',
                boxShadow: selectedTier ? '0 5px 20px rgba(255, 214, 165, 0.3)' : 'none',
                opacity: selectedTier ? 1 : 0.6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (selectedTier && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#FFC98B';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 214, 165, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTier && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#FFD6A5';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 214, 165, 0.3)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} />
                  Setting up...
                </>
              ) : (
                'Continue to therapy →'
              )}
            </button>
            
            <p style={{
              marginTop: '20px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '300',
            }}>
              You can change your plan anytime in settings
            </p>
          </div>
        </div>
      </main>

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
        
        .animate-slide-up {
          animation: slideUp 0.5s ease;
        }
        
        @keyframes slideUp {
          from { 
            transform: translateY(20px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}