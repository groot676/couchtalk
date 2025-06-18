'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Users, Copy, Check, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(initialWaiting);
  const [copied, setCopied] = useState(false);
  const [effectivePartnerName, setEffectivePartnerName] = useState<string | null>(partnerName || null);
  const [sessionCreatorId, setSessionCreatorId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);
  const welcomeMessageCheckRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  console.log('CouplesChatInterface initialized with:', {
    sessionId,
    sessionCode,
    userId,
    userName,
    partnerName,
    isWaiting: initialWaiting
  });

  // Get session creator ID immediately
  useEffect(() => {
    const getSessionCreatorId = async () => {
      if (!sessionId || sessionCreatorId) return;
      
      const { data: coupleSession } = await supabase
        .from('couple_sessions')
        .select('partner1_id')
        .eq('session_id', sessionId)
        .single();
      
      if (coupleSession && coupleSession.partner1_id) {
        setSessionCreatorId(coupleSession.partner1_id);
        console.log('Session creator ID set:', coupleSession.partner1_id);
      }
    };
    
    getSessionCreatorId();
  }, [sessionId, sessionCreatorId, supabase]);

  // Function to load only new messages
  const loadNewMessages = useCallback(async () => {
    if (!sessionId) return;
    
    console.log('Checking for new messages after:', lastMessageIdRef.current);
    
    try {
      // Build query for new messages only
      let query = supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      // If we have a last message ID, only get messages after that
      if (lastMessageIdRef.current) {
        const lastMessage = messages.find(m => m.id === lastMessageIdRef.current);
        if (lastMessage) {
          query = query.gt('created_at', lastMessage.created_at);
        }
      }
      
      const { data: newMessages, error } = await query;
      
      if (error) {
        console.error('Error fetching new messages:', error);
        return;
      }
      
      if (!newMessages || newMessages.length === 0) {
        console.log('No new messages found');
        return;
      }
      
      console.log(`Found ${newMessages.length} new messages`);
      
      // Decrypt only the new messages
      const response = await fetch(`/api/messages?sessionId=${sessionId}&userId=${userId}&messageIds=${newMessages.map(m => m.id).join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const { messages: decryptedNewMessages } = await response.json();
      
      // Get partner name if we don't have it yet
      let localPartnerName = effectivePartnerName || partnerName;
      if (!localPartnerName && messages.length === 0) {
        const { data: coupleSession } = await supabase
          .from('couple_sessions')
          .select('partner1_id, partner2_id')
          .eq('session_id', sessionId)
          .single();

        if (coupleSession) {
          const partnerId = coupleSession.partner1_id === userId 
            ? coupleSession.partner2_id 
            : coupleSession.partner1_id;

          if (partnerId) {
            const { data: partnerProfile } = await supabase
              .from('user_profiles')
              .select('name')
              .eq('id', partnerId)
              .single();

            if (partnerProfile?.name) {
              localPartnerName = partnerProfile.name;
              setEffectivePartnerName(partnerProfile.name);
            }
          }
        }
      }
      
      // Format and add only truly new messages
      const formattedNewMessages = decryptedNewMessages
        .filter((msg: any) => !messageIdsRef.current.has(msg.id))
        .map((msg: any) => {
          let senderName = 'CouchTalk';
          if (msg.sender_type === 'user') {
            senderName = msg.sender_id === userId ? userName : (localPartnerName || 'Partner');
          }
          
          messageIdsRef.current.add(msg.id);
          return {
            ...msg,
            sender_name: senderName
          };
        });
      
      if (formattedNewMessages.length > 0) {
        setMessages(prev => {
          // Create a map of existing messages by content and sender for deduplication
          const existingMessages = new Map();
          prev.forEach(msg => {
            const key = `${msg.content}-${msg.sender_type}-${msg.sender_id || 'ai'}`;
            existingMessages.set(key, msg);
          });
          
          // Filter out any new messages that duplicate optimistic/temp messages
          const trulyNewMessages = formattedNewMessages.filter((newMsg: any) => {
            const key = `${newMsg.content}-${newMsg.sender_type}-${newMsg.sender_id || 'ai'}`;
            const existing = existingMessages.get(key);
            
            // If there's an existing message with same content, check if it's optimistic
            if (existing && (existing.id.startsWith('optimistic-') || existing.id.startsWith('temp-'))) {
              // Replace the optimistic/temp message with the real one
              return true;
            }
            
            // Otherwise, only add if it doesn't exist
            return !existing;
          });
          
          // Remove optimistic/temp messages that now have real counterparts
          const filteredPrev = prev.filter(msg => {
            if (msg.id.startsWith('optimistic-') || msg.id.startsWith('temp-')) {
              const key = `${msg.content}-${msg.sender_type}-${msg.sender_id || 'ai'}`;
              const hasRealVersion = trulyNewMessages.some((newMsg: any) => 
                `${newMsg.content}-${newMsg.sender_type}-${newMsg.sender_id || 'ai'}` === key
              );
              return !hasRealVersion;
            }
            return true;
          });
          
          return [...filteredPrev, ...trulyNewMessages];
        });
        
        // Update last message ID
        const lastNewMessage = formattedNewMessages[formattedNewMessages.length - 1];
        lastMessageIdRef.current = lastNewMessage.id;
      }
    } catch (error) {
      console.error('Error loading new messages:', error);
    }
  }, [sessionId, userId, messages, effectivePartnerName, partnerName, userName, supabase]);

  // Function to load all messages (used only for initial load)
  const loadAllMessages = async () => {
    if (!sessionId) {
      console.error('No session ID provided');
      return;
    }
    
    console.log('Loading all messages for session:', sessionId);
    
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}&userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const { messages: fetchedMessages } = await response.json();
      console.log('Messages from API:', fetchedMessages);

      // Get partner name if we don't have it
      let localPartnerName = effectivePartnerName || partnerName;
      if (!localPartnerName && fetchedMessages && fetchedMessages.length > 0) {
        const { data: coupleSession } = await supabase
          .from('couple_sessions')
          .select('partner1_id, partner2_id')
          .eq('session_id', sessionId)
          .single();

        if (coupleSession) {
          if (!sessionCreatorId) {
            setSessionCreatorId(coupleSession.partner1_id);
          }

          const partnerId = coupleSession.partner1_id === userId 
            ? coupleSession.partner2_id 
            : coupleSession.partner1_id;

          if (partnerId) {
            const { data: partnerProfile } = await supabase
              .from('user_profiles')
              .select('name')
              .eq('id', partnerId)
              .single();

            if (partnerProfile?.name) {
              localPartnerName = partnerProfile.name;
              setEffectivePartnerName(partnerProfile.name);
            }
          }
        }
      }

      if (fetchedMessages) {
        // Clear existing tracking
        messageIdsRef.current.clear();
        
        const formattedMessages = fetchedMessages.map((msg: any) => {
          let senderName = 'CouchTalk';
          if (msg.sender_type === 'user') {
            senderName = msg.sender_id === userId ? userName : (localPartnerName || 'Partner');
          }
          
          messageIdsRef.current.add(msg.id);
          return {
            ...msg,
            sender_name: senderName
          };
        });
        
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
        
        // Set last message ID
        if (formattedMessages.length > 0) {
          lastMessageIdRef.current = formattedMessages[formattedMessages.length - 1].id;
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isWaiting && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      const ensureEncryption = async () => {
        try {
          await fetch('/api/ensure-encryption', { method: 'POST' });
          console.log('Ensured encryption key for user');
        } catch (error) {
          console.error('Error ensuring encryption:', error);
        }
      };
      
      ensureEncryption().then(() => {
        loadAllMessages();
      });
    }
  }, [isWaiting]);

  // Create welcome message when both partners have joined
  useEffect(() => {
    const createWelcomeMessage = async () => {
      if (isWaiting || welcomeMessageCheckRef.current || !sessionId) return;
      
      welcomeMessageCheckRef.current = true;
      
      try {
        const { data: coupleSession } = await supabase
          .from('couple_sessions')
          .select('partner1_id, partner2_id')
          .eq('session_id', sessionId)
          .single();
        
        if (!coupleSession || coupleSession.partner1_id !== userId) {
          console.log('Not partner1, skipping welcome message creation');
          return;
        }
        
        if (!coupleSession.partner2_id) {
          console.log('Partner2 not yet joined, skipping welcome message');
          welcomeMessageCheckRef.current = false;
          return;
        }
        
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('session_id', sessionId)
          .eq('sender_type', 'ai')
          .limit(1);

        if (existingMessages && existingMessages.length > 0) {
          console.log('Welcome message already exists');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: finalCheck } = await supabase
          .from('messages')
          .select('id')
          .eq('session_id', sessionId)
          .eq('sender_type', 'ai')
          .limit(1);
          
        if (finalCheck && finalCheck.length > 0) {
          console.log('Welcome message created by other process');
          return;
        }
        
        console.log('Creating welcome message as partner1...');
        
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: userId,
            content: "Welcome to your couple's session! I'm here to help facilitate a meaningful conversation between you both. Remember to speak from your own experience using 'I feel' statements, and take turns listening to each other. What would you like to discuss today?",
            senderType: 'ai'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save welcome message');
        }

        console.log('Welcome message created successfully');
        // Load only the new message
        await loadNewMessages();
      } catch (error) {
        console.error('Error creating welcome message:', error);
        welcomeMessageCheckRef.current = false;
      }
    };

    createWelcomeMessage();
  }, [isWaiting, sessionId, userId, supabase, loadNewMessages]);

  // Set up real-time subscription and smart polling
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up realtime subscription for session:', sessionId);

    // Smart polling - starts fast, then slows down
    let pollDelay = 2000; // Start with 2 seconds
    const maxPollDelay = 10000; // Max 10 seconds
    
    const startPolling = () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
      
      const poll = () => {
        console.log(`Polling with ${pollDelay}ms delay`);
        loadNewMessages();
        
        // Gradually increase delay up to max
        if (pollDelay < maxPollDelay) {
          pollDelay = Math.min(pollDelay * 1.5, maxPollDelay);
        }
        
        pollIntervalRef.current = setTimeout(poll, pollDelay);
      };
      
      pollIntervalRef.current = setTimeout(poll, pollDelay);
    };
    
    startPolling();

    // Set up realtime subscription
    const channel = supabase
      .channel(`room-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couple_sessions',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Couple session update:', payload);
          if (payload.new.status === 'active' && isWaiting) {
            setIsWaiting(false);
            welcomeMessageCheckRef.current = false;
            loadAllMessages();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New message via realtime:', payload);
          // Reset polling delay when new activity detected
          pollDelay = 2000;
          startPolling();
          loadNewMessages();
        }
      )
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscriptions');
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
      channel.unsubscribe();
    };
  }, [sessionId, isWaiting, loadNewMessages]);

  // Auto-scroll
  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isWaiting) return;

    if (!sessionCreatorId) {
      const { data: coupleSession } = await supabase
        .from('couple_sessions')
        .select('partner1_id')
        .eq('session_id', sessionId)
        .single();
      
      if (coupleSession?.partner1_id) {
        setSessionCreatorId(coupleSession.partner1_id);
      }
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add optimistic message immediately
    const optimisticMessageId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticMessageId,
      content: userMessage,
      sender_type: 'user',
      sender_id: userId,
      created_at: new Date().toISOString(),
      sender_name: userName
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      console.log('Sending message:', userMessage);
      
      // Save user message via API
      const saveResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: userId,
          content: userMessage,
          senderType: 'user',
          actualSenderId: userId
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save message');
      }

      console.log('User message saved successfully');
      
      // Load new messages first
      await loadNewMessages();
      
      // Then remove optimistic message only if the real one was loaded
      setMessages(prev => {
        // Check if we have the real message
        const hasRealMessage = prev.some(m => 
          m.content === userMessage && 
          m.sender_id === userId && 
          m.id !== optimisticMessageId
        );
        
        if (hasRealMessage) {
          return prev.filter(m => m.id !== optimisticMessageId);
        }
        // Keep optimistic message if real one hasn't loaded yet
        return prev;
      });
      
      // Format messages for API
      const apiMessages = messages
        .filter(m => m.id !== optimisticMessageId)
        .map(m => ({
          role: m.sender_type === 'ai' ? 'assistant' : 'user',
          content: m.sender_type === 'ai' ? m.content : `${m.sender_name}: ${m.content}`
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
          mode: 'couple',
          sessionId,
          userId: userId
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Show streaming AI response locally
      const tempAiMessageId = `temp-ai-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempAiMessageId,
        content: '',
        sender_type: 'ai',
        sender_id: null,
        created_at: new Date().toISOString(),
        sender_name: 'CouchTalk'
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          
          // Update the temporary AI message
          setMessages(prev => prev.map(msg => 
            msg.id === tempAiMessageId 
              ? { ...msg, content: assistantMessage }
              : msg
          ));
        }
        
        console.log('AI streaming complete. Full message:', assistantMessage);
        console.log('About to save AI message from client...');

        // Save the AI message
        try {
          const saveAIResponse = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              userId: userId,
              content: assistantMessage,
              senderType: 'ai'
            }),
          });

          if (!saveAIResponse.ok) {
            console.error('Failed to save AI message');
          } else {
            console.log('AI message saved successfully from client');
          }
        } catch (error) {
          console.error('Error saving AI message:', error);
        }

        // Load new messages first
        await loadNewMessages();
        
        // Then remove temp message only if the real AI message was loaded
        setMessages(prev => {
          // Check if we have the real AI message
          const hasRealAIMessage = prev.some(m => 
            m.content === assistantMessage && 
            m.sender_type === 'ai' && 
            m.id !== tempAiMessageId
          );
          
          if (hasRealAIMessage) {
            return prev.filter(m => m.id !== tempAiMessageId);
          }
          // Keep temp message if real one hasn't loaded yet
          return prev;
        });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessageId));
      
      // Show error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        sender_type: 'ai',
        sender_id: null,
        created_at: new Date().toISOString(),
        sender_name: 'CouchTalk'
      };
      setMessages(prev => [...prev, errorMessage]);
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
            Once they join with this code, you&apos;ll both be connected to start your session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[800px] w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
              <Heart className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Couple&apos;s Session</h2>
              <p className="text-sm text-white/70">
                {userName} & {effectivePartnerName || partnerName || 'Partner'} with CouchTalk
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadNewMessages()}
              className="text-white/60 hover:text-white transition-colors"
              title="Check for new messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="text-sm text-white/60">
              Code: {sessionCode}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-6 bg-gradient-to-b from-gray-50 to-white" ref={scrollAreaRef}>
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">Welcome to your couple&apos;s session!</p>
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
                  {message.sender_name || `User ${message.sender_id?.slice(-4) || 'Unknown'}`}
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
      <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
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