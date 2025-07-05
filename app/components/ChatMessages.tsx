import { cn } from '@/lib/utils';

export default function ChatMessages({
  messages,
  isTyping,
  messagesEndRef,
}: {
  messages: { id: string; content: string; isUser: boolean; timestamp: string }[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex animate-in slide-in-from-bottom-4 duration-300",
            message.isUser ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[80%] p-4 rounded-2xl glass",
              message.isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-foreground"
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
      {isTyping && (
        <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-muted/50 p-4 rounded-2xl glass">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}