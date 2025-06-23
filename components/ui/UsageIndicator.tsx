// /components/ui/UsageIndicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface UsageInfo {
  tier: string;
  remainingMessages: number | null;
  canSendMessage: boolean;
}

interface UsageIndicatorProps {
  userId: string;
  refreshTrigger?: number; // Add this to trigger refresh
}

export function UsageIndicator({ userId, refreshTrigger }: UsageIndicatorProps) {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    console.log('Fetching usage data...');
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        console.log('Usage data received:', data);
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('UsageIndicator effect triggered, refreshTrigger:', refreshTrigger);
    fetchUsage();
  }, [userId, refreshTrigger]); // Re-fetch when refreshTrigger changes

  if (loading || !usage) return null;

  const isFreeTier = usage.tier === 'free';
  const lowMessages = usage.remainingMessages !== null && usage.remainingMessages <= 5;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(20px)',
      padding: '12px 20px',
      borderRadius: '25px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 20,
    }}>
      {isFreeTier ? (
        <>
          {lowMessages ? (
            <AlertCircle style={{ width: '16px', height: '16px', color: '#FFD6A5' }} />
          ) : (
            <Sparkles style={{ width: '16px', height: '16px', color: '#FFD6A5' }} />
          )}
          <span>
            {usage.remainingMessages} messages left
          </span>
          {lowMessages && (
            <a
              href="/upgrade"
              style={{
                color: '#FFD6A5',
                textDecoration: 'none',
                marginLeft: '8px',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Upgrade
            </a>
          )}
        </>
      ) : (
        <>
          <Sparkles style={{ width: '16px', height: '16px', color: '#FFD6A5' }} />
          <span>Premium • Unlimited</span>
        </>
      )}
    </div>
  );
}