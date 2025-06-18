interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          borderRadius: '18px',
          padding: '16px 20px',
          fontSize: '15px',
          lineHeight: '1.6',
          boxShadow: isUser 
            ? '0 4px 12px rgba(255, 214, 165, 0.2)' 
            : '0 4px 12px rgba(0, 0, 0, 0.2)',
          backgroundColor: isUser 
            ? '#FFD6A5' 
            : 'rgba(255, 255, 255, 0.1)',
          color: isUser 
            ? '#1A1A1A' 
            : '#FAFAF8',
          border: isUser 
            ? '1px solid rgba(255, 214, 165, 0.3)' 
            : '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: isUser ? 'none' : 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
      >
        {!isUser && (
          <div style={{
            fontSize: '12px',
            color: '#FFD6A5',
            fontWeight: '600',
            marginBottom: '4px',
            fontFamily: 'Crimson Text, serif',
          }}>
            CouchTalk
          </div>
        )}
        <p style={{ 
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content}
        </p>
      </div>
    </div>
  );
}