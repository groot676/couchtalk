'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

  // [Keep all the existing hooks and functions - they remain the same]
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
      }
    };
    
    getSessionCreatorId();
  }, [sessionId, sessionCreatorId, supabase]);

  // Function to load only new messages
  const loadNewMessages = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
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
        return;
      }
      
      const response = await fetch(`/api/messages?sessionId=${sessionId}&userId=${userId}&messageIds=${newMessages.map(m => m.id).join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const { messages: decryptedNewMessages } = await response.json();
      
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
          const existingMessages = new Map();
          prev.forEach(msg => {
            const key = `${msg.content}-${msg.sender_type}-${msg.sender_id || 'ai'}`;
            existingMessages.set(key, msg);
          });
          
          const trulyNewMessages = formattedNewMessages.filter((newMsg: any) => {
            const key = `${newMsg.content}-${newMsg.sender_type}-${newMsg.sender_id || 'ai'}`;
            const existing = existingMessages.get(key);
            
            if (existing && (existing.id.startsWith('optimistic-') || existing.id.startsWith('temp-'))) {
              return true;
            }
            
            return !existing;
          });
          
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
      return;
    }
    
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}&userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const { messages: fetchedMessages } = await response.json();

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
        
        setMessages(formattedMessages);
        
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
          return;
        }
        
        if (!coupleSession.partner2_id) {
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
          return;
        }
        
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: userId,
            content: "Welcome to your couple's sanctuary! I'm here to help facilitate a meaningful conversation between you both. Remember to speak from your own experience using 'I feel' statements, and take turns listening to each other. What would you like to discuss today?",
            senderType: 'ai'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save welcome message');
        }

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

    let pollDelay = 2000;
    const maxPollDelay = 10000;
    
    const startPolling = () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
      
      const poll = () => {
        loadNewMessages();
        
        if (pollDelay < maxPollDelay) {
          pollDelay = Math.min(pollDelay * 1.5, maxPollDelay);
        }
        
        pollIntervalRef.current = setTimeout(poll, pollDelay);
      };
      
      pollIntervalRef.current = setTimeout(poll, pollDelay);
    };
    
    startPolling();

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
          pollDelay = 2000;
          startPolling();
          loadNewMessages();
        }
      )
      .subscribe();

    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
      channel.unsubscribe();
    };
  }, [sessionId, isWaiting, loadNewMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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
      
      await loadNewMessages();
      
      setMessages(prev => {
        const hasRealMessage = prev.some(m => 
          m.content === userMessage && 
          m.sender_id === userId && 
          m.id !== optimisticMessageId
        );
        
        if (hasRealMessage) {
          return prev.filter(m => m.id !== optimisticMessageId);
        }
        return prev;
      });
      
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
          
          setMessages(prev => prev.map(msg => 
            msg.id === tempAiMessageId 
              ? { ...msg, content: assistantMessage }
              : msg
          ));
        }

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
          }
        } catch (error) {
          console.error('Error saving AI message:', error);
        }

        await loadNewMessages();
        
        setMessages(prev => {
          const hasRealAIMessage = prev.some(m => 
            m.content === assistantMessage && 
            m.sender_type === 'ai' && 
            m.id !== tempAiMessageId
          );
          
          if (hasRealAIMessage) {
            return prev.filter(m => m.id !== tempAiMessageId);
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      setMessages(prev => prev.filter(m => m.id !== optimisticMessageId));
      
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '600px' 
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '48px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(255, 240, 242, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 200, 200, 0.3)',
          }}>
            <Users style={{ width: '32px', height: '32px', color: '#FFB5B5' }} />
          </div>
          
          <h2 style={{
            fontSize: '28px',
            fontFamily: 'Crimson Text, serif',
            fontWeight: '400',
            color: '#FAFAF8',
            marginBottom: '16px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}>
            Waiting for your partner...
          </h2>
          
          <div style={{
            background: 'rgba(255, 214, 165, 0.1)',
            border: '1px solid rgba(255, 214, 165, 0.2)',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
          }}>
            <p style={{ fontSize: '13px', color: '#FFD6A5', marginBottom: '8px' }}>Share this code:</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#FAFAF8',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
              }}>
                {sessionCode}
              </p>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '6px',
                  backgroundColor: copied ? 'rgba(107, 142, 127, 0.2)' : 'transparent',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  if (!copied) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {copied ? (
                  <Check style={{ width: '18px', height: '18px', color: '#6B8E7F' }} />
                ) : (
                  <Copy style={{ width: '18px', height: '18px', color: '#FFD6A5' }} />
                )}
              </button>
            </div>
          </div>
          
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.5',
          }}>
            Once they join with this code, you'll both be connected to start your session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '24px 28px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '10px',
              background: 'rgba(255, 240, 242, 0.15)',
              borderRadius: '50%',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 200, 200, 0.3)',
            }}>
              <Heart style={{ width: '24px', height: '24px', color: '#FFB5B5' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontFamily: 'Crimson Text, serif',
                fontWeight: '600',
                color: '#FAFAF8',
                margin: 0,
              }}>
                Couple's Session
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
              }}>
                {userName} & {effectivePartnerName || partnerName || 'Partner'} with CouchTalk
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            Code: {sessionCode}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollAreaRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                Welcome to your couple's sanctuary!
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>
                CouchTalk will help guide your conversation.
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: message.sender_id === userId ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  backgroundColor: message.sender_type === 'ai'
                    ? 'rgba(255, 214, 165, 0.15)'
                    : message.sender_id === userId
                    ? '#FFD6A5'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: message.sender_type === 'ai' || message.sender_id !== userId
                    ? '#FAFAF8'
                    : '#1A1A1A',
                  border: message.sender_type === 'ai'
                    ? '1px solid rgba(255, 214, 165, 0.2)'
                    : message.sender_id === userId
                    ? '1px solid rgba(255, 214, 165, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: message.sender_id === userId ? 'none' : 'blur(10px)',
                  width: message.sender_type === 'ai' ? '100%' : 'auto',
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: message.sender_type === 'ai'
                    ? '#FFD6A5'
                    : message.sender_id === userId
                    ? 'rgba(26, 26, 26, 0.6)'
                    : 'rgba(255, 255, 255, 0.6)',
                  fontFamily: message.sender_type === 'ai' ? 'Crimson Text, serif' : 'inherit',
                }}>
                  {message.sender_name}
                </div>
                <p style={{ 
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '12px 20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 style={{ width: '16px', height: '16px', color: '#FFD6A5' }} className="animate-spin" />
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    CouchTalk is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '24px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isWaiting ? "Waiting for partner..." : "Share your thoughts..."}
            disabled={isLoading || isWaiting}
            style={{
              flex: 1,
              height: '48px',
              padding: '0 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              fontSize: '15px',
              color: '#FAFAF8',
              transition: 'all 0.3s ease',
              outline: 'none',
              backdropFilter: 'blur(10px)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 214, 165, 0.4)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isWaiting}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isLoading || !input.trim() || isWaiting ? 'rgba(255, 214, 165, 0.3)' : '#FFD6A5',
              color: '#1A1A1A',
              border: 'none',
              cursor: isLoading || !input.trim() || isWaiting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading || !input.trim() || isWaiting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading && input.trim() && !isWaiting) {
                e.currentTarget.style.backgroundColor = '#FFC98B';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && input.trim() && !isWaiting) {
                e.currentTarget.style.backgroundColor = '#FFD6A5';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isLoading ? (
              <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
            ) : (
              <Send style={{ width: '20px', height: '20px' }} />
            )}
          </button>
        </div>
      </form>

      {/* Scrollbar styles */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 214, 165, 0.3);
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 214, 165, 0.5);
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}