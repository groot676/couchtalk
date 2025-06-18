import { CouplesChatInterface } from '@/app/couple/chat/[sessionId]/CouplesChatInterface';
import { Header } from '@/components/ui/Header';
import { AtmosphereEffects } from '@/components/ui/AtmosphereEffects';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function CoupleChatPage({ params }: PageProps) {
  const { sessionId } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get couple session info
  const { data: coupleSession } = await supabase
    .from('couple_sessions')
    .select(`
      *,
      session:sessions(*)
    `)
    .or(`session_code.eq.${sessionId},session_id.eq.${sessionId}`)
    .single();

  if (!coupleSession) {
    redirect('/couple/start');
  }

  // Get partner info if they've joined
  let partnerProfile = null;
  if (coupleSession.partner2_id && coupleSession.partner1_id) {
    const partnerId = coupleSession.partner1_id === user.id 
      ? coupleSession.partner2_id 
      : coupleSession.partner1_id;
    
    if (partnerId) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (!error) {
        partnerProfile = data;
      }
    }
  }

  return (
    <>
      <AtmosphereEffects />
      
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
          <Header userName={profile?.name || 'Friend'} />
        </div>

        <main style={{ 
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          overflow: 'hidden',
        }}>
          <div style={{ marginBottom: '24px', textAlign: 'center', flexShrink: 0 }}>
            <h1 style={{
              fontSize: '42px',
              fontFamily: 'Crimson Text, serif',
              fontWeight: '400',
              color: '#FAFAF8',
              marginBottom: '8px',
              textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
            }}>
              Your shared <span style={{ color: '#FFD6A5', fontStyle: 'italic' }}>sanctuary</span>
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '300',
            }}>
              A safe space for meaningful conversations together
            </p>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <CouplesChatInterface 
              sessionId={coupleSession.session_id}
              sessionCode={coupleSession.session_code}
              userId={user.id}
              userName={profile?.name || 'You'}
              partnerName={partnerProfile?.name}
              isWaiting={coupleSession.status === 'waiting'}
            />
          </div>
        </main>
      </div>
    </>
  );
}