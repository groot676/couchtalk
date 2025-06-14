import { ChatInterface } from '../components/ChatInterface';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome to CouchTalk
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            Your personal AI companion for mental wellness
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800">
            <span>⚠️</span>
            <span>Not a substitute for professional mental health care</span>
          </div>
        </div>
        
        <ChatInterface />
        
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-500">
            Your conversations are private and not stored
          </p>
          <p className="text-xs text-gray-400">
            Powered by advanced AI with CBT and ACT training
          </p>
        </div>
      </div>
    </main>
  );
}