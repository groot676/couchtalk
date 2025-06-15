'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Users, Copy, Check, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'ai' | 'partner';
  sender_id: string | null;
  created_at: string;
  sender_name?: string;
}

interface CouplesChatInterfaceProps {
  sessionId: string;
  sessionCode: string;
  userId: string;
  userName: string;
  partnerName?: string | null;
  isWaiting: boolean;
}

export function CouplesChatInterface({
  sessionId,
  sessionCode,
  userId,
  userName,
  partnerName,
  isWaiting: initialWaiting
}: CouplesChatInterfaceProps) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      content: "Welcome to your couple's session! I'm here to help facilitate a meaningful conversation between you both. Remember to speak from your own experience using 'I feel' statements, and take turns listening to each other. What would you like to discuss today?",
      sender_type: 'ai',
      sender_id: null,
      created_at: new Date().toISOString(),
      sender_name: 'CouchTalk'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(initialWaiting);
  const [copied, setCopied] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          ...msg,
          sender_name: msg.sender_type === 'ai' ? 'CouchTalk' : 
                       msg.sender_id === userId ? userName : partnerName || 'Partner'
        })));
      } else {
        // Save initial message if this is a new session
        const initialMessage = {
          content: "Welcome to your couple's session! I'm here to help facilitate a meaningful conversation between you both. Remember to speak from your own experience using 'I feel' statements, and take turns listening to each other. What would you like to discuss today?",
          sender_type: 'ai' as const,
          sender_id: null,
          sender_name: 'CouchTalk'
        };
        await saveMessage(initialMessage);
      }
    };

    loadMessages();
  }, [sessionId, supabase, userId, userName, partnerName]);

  // Set up real-time subscription
  useEffect(() => {
    // Subscribe to couple session updates
    const coupleChannel = supabase
      .channel(`couple_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couple_sessions',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new.status === 'active') {
            setIsWaiting(false);
            router.refresh(); // Refresh to get partner info
          }
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            ...newMessage,
            sender_name: newMessage.sender_type === 'ai' ? 'CouchTalk' : 
                        newMessage.sender_id === userId ? userName : partnerName || 'Partner'
          }]);
        }
      )
      .subscribe();

    channelRef.current = { coupleChannel, messageChannel };

    return () => {
      coupleChannel.unsubscribe();
      messageChannel.unsubscribe();
    };
  }, [sessionId, supabase, userId, userName, partnerName, router]);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessage = async (message: Omit<Message, 'id' | 'created_at'>) => {
    await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        sender_id: message.sender_id,
        sender_type: message.sender_type,
        content: message.content
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isWaiting) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage({
      content: userMessage,
      sender_type: 'user',
      sender_id: userId,
      sender_name: userName
    });

    try {
      // Format messages for API - only include actual message content
      const apiMessages = messages
        .filter(m => m.id !== 'initial') // Skip the initial message if it has this ID
        .map(m => ({
          role: m.sender_type === 'ai' ? 'assistant' : 'user',
          content: `${m.sender_name}: ${m.content}`
        }))
        .concat({ 
          role: 'user', 
          content: `${userName}: ${userMessage}` 
        });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: 'couple'
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
        }
        
        // Save AI message
        await saveMessage({
          content: assistantMessage,
          sender_type: 'ai',
          sender_id: null,
          sender_name: 'CouchTalk'
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isWaiting) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-6 mx-auto">
            <Users className="w-8 h-8 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Waiting for your partner...
          </h2>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 mb-2">Share this code:</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-bold text-amber-900">{sessionCode}</p>
              <button
                onClick={copyToClipboard}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-amber-700" />
                )}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Once they join with this code, you'll both be connected to start your session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
              <Heart className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Couple's Session</h2>
              <p className="text-sm text-white/70">
                {userName} & {partnerName || 'Partner'} with CouchTalk
              </p>
            </div>
          </div>
          <div className="text-sm text-white/60">
            Code: {sessionCode}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-gray-50 to-white" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">Welcome to your couple's session!</p>
              <p className="text-sm text-gray-400">
                CouchTalk will help guide your conversation.
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-full ${
                message.sender_id === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                  message.sender_type === 'ai'
                    ? 'bg-amber-50 text-gray-800 w-full'
                    : message.sender_id === userId
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  message.sender_type === 'ai' 
                    ? 'text-amber-600' 
                    : message.sender_id === userId
                    ? 'text-white/70'
                    : 'text-gray-500'
                }`}>
                  {message.sender_name}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">CouchTalk is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isWaiting ? "Waiting for partner..." : "Share your thoughts..."}
            disabled={isLoading || isWaiting}
            className="flex-1 h-12 px-4 border-gray-200 focus:border-amber-400 transition-colors rounded-full bg-gray-50"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim() || isWaiting}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}