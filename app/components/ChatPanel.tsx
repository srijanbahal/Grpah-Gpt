import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsDropdown } from '@/components/settings-dropdown';
import { ModeToggle } from '@/components/mode-toggle';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function ChatPanel({
  messages,
  isTyping,
  loading,
  error,
  inputValue,
  setInputValue,
  onSendMessage,
  selectedModel,
  setSelectedModel,
  modelOptions,
  onFileUpload,
  selectedSession,
  messagesEndRef,
}: any) {
  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      {/* Header */}
      <div className="flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur-sm ">
        <div className="flex items-center space-x-2 ">
          <SettingsDropdown />
          <ModeToggle />
        </div>
      </div>
      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}
      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative min-h-0">
        <div className="absolute inset-0 cosmic-gradient dark:cosmic-gradient opacity-50" />
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
              Loading chat history...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-8">
              <div className="text-center space-y-6 max-w-2xl w-full">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent animate-float">
                  How can I help you?
                </h1>
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                  {/* Add new session button here if needed */}
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <ChatMessages messages={messages} isTyping={isTyping} messagesEndRef={messagesEndRef} />
            </ScrollArea>
          )}
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={onSendMessage}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            modelOptions={modelOptions}
            onFileUpload={onFileUpload}
            loading={loading}
            isTyping={isTyping}
            selectedSession={selectedSession}
          />
        </div>
      </div>
    </div>
  );
}