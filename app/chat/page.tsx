import { ChatInterface } from '../components/ChatInterface';
import { Header } from '@/components/ui/Header';
import { AtmosphereEffects } from '@/components/ui/AtmosphereEffects';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Redirect if not authenticated
  if (error || !user) {
    redirect('/signin');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If no profile exists, redirect to complete profile
  if (!profile) {
    redirect('/signup?step=2');
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
              Your personal <span style={{ color: '#FFD6A5', fontStyle: 'italic' }}>sanctuary</span>
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '300',
            }}>
              A safe space for meaningful conversations
            </p>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ChatInterface />
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px', flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 214, 165, 0.1)',
              border: '1px solid rgba(255, 214, 165, 0.2)',
              borderRadius: '25px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
            }}>
              <span>⚠️</span>
              <span>Not a substitute for professional mental health care</span>
            </div>
          </div>
        </main>
      </div>


    </>
  );
}