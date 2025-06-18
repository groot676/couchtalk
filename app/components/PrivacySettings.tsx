// /components/PrivacySettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PrivacySettings() {
  const [privacyMode, setPrivacyMode] = useState<'regular' | 'maximum'>('regular');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Fetch current privacy mode
    const fetchPrivacyMode = async () => {
      try {
        const response = await fetch('/api/privacy');
        if (response.ok) {
          const data = await response.json();
          setPrivacyMode(data.privacyMode);
        }
      } catch (error) {
        console.error('Error fetching privacy mode:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyMode();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: privacyMode }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving privacy mode:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading privacy settings...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Choose how your messages are protected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={privacyMode} onValueChange={(value) => setPrivacyMode(value as 'regular' | 'maximum')}>
          <div className="space-y-4">
            {/* Regular Security Option */}
            <label
              htmlFor="regular"
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                privacyMode === 'regular' 
                  ? 'border-amber-500 bg-amber-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <RadioGroupItem value="regular" id="regular" className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Regular Security (Recommended)
                </div>
                <p className="text-sm text-gray-600">
                  Your messages are encrypted on our servers. You can reset your password if forgotten, 
                  and we can recover your data if needed. We can only decrypt messages if legally required.
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>✓ Password reset available</li>
                  <li>✓ No risk of data loss</li>
                  <li>✓ Encrypted at rest</li>
                </ul>
              </div>
            </label>

            {/* Maximum Privacy Option */}
            <label
              htmlFor="maximum"
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                privacyMode === 'maximum' 
                  ? 'border-amber-500 bg-amber-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <RadioGroupItem value="maximum" id="maximum" className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Maximum Privacy (Coming Soon)
                </div>
                <p className="text-sm text-gray-600">
                  End-to-end encryption. Your messages are encrypted in your browser before being sent. 
                  Not even CouchTalk can read your messages. You must backup your encryption key.
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>⚠️ Must backup encryption key</li>
                  <li>⚠️ Lost key = lost messages</li>
                  <li>✓ Maximum privacy protection</li>
                </ul>
              </div>
            </label>
          </div>
        </RadioGroup>

        {privacyMode === 'maximum' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Maximum privacy mode is coming soon. When available, 
              you&apos;ll need to securely backup your encryption key. If you lose it, your messages 
              cannot be recovered.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            Changes will apply to new messages only
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || privacyMode === 'maximum'}
            className="min-w-[100px]"
          >
            {saving ? (
              'Saving...'
            ) : saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}