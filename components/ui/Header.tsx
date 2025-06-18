'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

interface HeaderProps {
  showSignOut?: boolean;
  userName?: string;
}

export function Header({ showSignOut = true, userName }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [privacyMode, setPrivacyMode] = useState<string>('regular');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Fetch privacy mode
    const fetchPrivacyMode = async () => {
      const response = await fetch('/api/privacy');
      if (response.ok) {
        const data = await response.json();
        setPrivacyMode(data.privacyMode);
      }
    };
    
    if (showSignOut) {
      fetchPrivacyMode();
    }
  }, [showSignOut]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return (
    <header 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ padding: '0 60px' }}>
        <div className="flex items-center justify-between" style={{ height: '72px' }}>
          <Link 
            href="/mode-select" 
            style={{ 
              fontSize: '36px',
              fontFamily: 'Crimson Text, serif',
              fontWeight: '600',
              color: '#FAFAF8',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              letterSpacing: '-0.02em',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFD6A5'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FAFAF8'}
          >
            CouchTalk
          </Link>

          {showSignOut && (
            <div className="flex items-center gap-6" style={{ paddingRight: '20px' }}>
              {privacyMode === 'regular' && (
                <div 
                  className="flex items-center gap-1.5"
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <Lock className="w-4 h-4" style={{ color: '#FFD6A5' }} />
                  <span>Encrypted</span>
                </div>
              )}
              
              {userName && (
                <span 
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                  }}
                >
                  Welcome back, <span style={{ color: '#FFD6A5', fontWeight: '500' }}>{userName}</span>
                </span>
              )}
              
              <button
                onClick={handleSignOut}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isHovered ? '#1A1A1A' : 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: isHovered ? '#FFD6A5' : 'rgba(255, 255, 255, 0.1)',
                  border: isHovered ? '1px solid #FFD6A5' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: isHovered ? '0 4px 12px rgba(255, 214, 165, 0.3)' : 'none',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}