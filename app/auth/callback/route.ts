// /app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      // Check if user profile exists (for Google OAuth users)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Create profile if it doesn't exist (Google OAuth)
      if (!profile) {
        await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email,
          });
      }

      // Redirect to mode selection after successful auth
      return NextResponse.redirect(new URL('/mode-select', requestUrl.origin));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/signin?error=auth_failed', requestUrl.origin));
}