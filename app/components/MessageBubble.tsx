import { cn } from '@/lib/utils';

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
      className={cn(
        'flex w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm transition-all',
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        )}
      >
        {!isUser && (
          <div className="text-xs text-purple-600 font-medium mb-1">MindSpace</div>
        )}
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}