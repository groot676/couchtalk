import { CouplesChatInterface } from '@/app/couple/chat/[sessionId]/CouplesChatInterface';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default async function CoupleChatPage({ params }: PageProps) {
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
    .or(`session_code.eq.${params.sessionId},session_id.eq.${params.sessionId}`)
    .single();

  if (!coupleSession) {
    redirect('/couple/start');
  }

  // Get partner info if they've joined
  let partnerProfile = null;
  if (coupleSession.partner2_id) {
    const partnerId = coupleSession.partner1_id === user.id 
      ? coupleSession.partner2_id 
      : coupleSession.partner1_id;
    
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', partnerId)
      .single();
    
    partnerProfile = data;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
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
  );
}