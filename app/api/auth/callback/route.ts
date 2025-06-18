// /app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUserEncryptionKey, userHasEncryptionKey } from '@/lib/encryption/keys';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has encryption key, create if not
      const hasKey = await userHasEncryptionKey(data.user.id);
      if (!hasKey) {
        try {
          await createUserEncryptionKey(data.user.id);
          console.log('Created encryption key for new user:', data.user.id);
        } catch (error) {
          console.error('Error creating encryption key for new user:', error);
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', request.url));
}