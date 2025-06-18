
// /app/privacy-test/page.tsx
import { PrivacySettings } from '../components/PrivacySettings';

export default function PrivacyTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Settings</h1>
      <PrivacySettings />
    </div>
  );
}