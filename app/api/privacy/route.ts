// /app/api/privacy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setUserPrivacyMode, getUserPrivacyMode } from '@/lib/encryption/keys';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const privacyMode = await getUserPrivacyMode(user.id);

    return NextResponse.json({ 
      privacyMode: privacyMode || 'regular' 
    });
  } catch (error) {
    console.error('Error fetching privacy mode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy mode' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { mode } = await request.json();

    if (!mode || !['regular', 'maximum'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid privacy mode' },
        { status: 400 }
      );
    }

    await setUserPrivacyMode(user.id, mode);

    return NextResponse.json({ 
      success: true,
      privacyMode: mode 
    });
  } catch (error) {
    console.error('Error updating privacy mode:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy mode' },
      { status: 500 }
    );
  }
}