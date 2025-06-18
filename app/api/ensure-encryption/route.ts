// /app/api/ensure-encryption/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUserEncryptionKey, userHasEncryptionKey } from '@/lib/encryption/keys';

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

    // Check if user already has an encryption key
    const hasKey = await userHasEncryptionKey(user.id);
    
    if (!hasKey) {
      // Create encryption key for the user
      await createUserEncryptionKey(user.id);
      console.log('Created encryption key for user:', user.id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Encryption key created'
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Encryption key already exists'
    });
  } catch (error) {
    console.error('Error ensuring encryption:', error);
    return NextResponse.json(
      { error: 'Failed to ensure encryption setup' },
      { status: 500 }
    );
  }
}