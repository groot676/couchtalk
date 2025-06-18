// /app/test-encryption/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function TestEncryptionPage() {
  const [status, setStatus] = useState<string>('');
  const [privacyMode, setPrivacyMode] = useState<string>('');
  const supabase = createClient();

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setStatus(`Logged in as: ${user.email} (ID: ${user.id})`);
      
      // Check privacy mode
      const response = await fetch('/api/privacy');
      if (response.ok) {
        const data = await response.json();
        setPrivacyMode(`Current privacy mode: ${data.privacyMode}`);
      }
    } else {
      setStatus('Not logged in');
    }
  };

  const createEncryptionKey = async () => {
    try {
      setStatus('Creating encryption key...');
      const response = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'regular' }),
      });
      
      if (response.ok) {
        setStatus('Encryption key created! Privacy mode set to regular.');
        checkUser();
      } else {
        const error = await response.json();
        setStatus(`Error: ${error.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const testEncryption = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('Please log in first');
        return;
      }

      // Get current session
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!session) {
        setStatus('No session found. Please go to chat first.');
        return;
      }

      setStatus('Sending encrypted message...');
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          userId: user.id,
          content: 'Test encrypted message',
          senderType: 'user'
        }),
      });

      if (response.ok) {
        setStatus('Message sent! Check your messages table in Supabase.');
      } else {
        const error = await response.json();
        setStatus(`Error: ${error.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Encryption</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-mono text-sm">{status || 'Click a button to start'}</p>
          {privacyMode && <p className="font-mono text-sm mt-2">{privacyMode}</p>}
        </div>

        <div className="space-x-4">
          <Button onClick={checkUser}>
            Check User Status
          </Button>
          
          <Button onClick={createEncryptionKey} variant="outline">
            Create Encryption Key
          </Button>
          
          <Button onClick={testEncryption} variant="outline">
            Test Send Encrypted Message
          </Button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded">
          <h2 className="font-bold mb-2">Steps to test:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Check User Status" to verify you're logged in</li>
            <li>Click "Create Encryption Key" to set up encryption</li>
            <li>Click "Test Send Encrypted Message" to test</li>
            <li>Check your Supabase messages table</li>
          </ol>
        </div>
      </div>
    </div>
  );
}