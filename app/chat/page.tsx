import { ChatInterface } from '../components/ChatInterface';
import { SignOutButton } from '../components/SignOutButton';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {profile?.name || 'Friend'}
            </h1>
            <p className="text-lg text-gray-600">
              Your personal sanctuary for meaningful conversations
            </p>
          </div>
          <SignOutButton />
        </div>
        
        <ChatInterface />
        
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800">
            <span>⚠️</span>
            <span>Not a substitute for professional mental health care</span>
          </div>
        </div>
      </div>
    </main>
  );
}