import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, ArrowUp, Search } from 'lucide-react';
import ModelDropdown from './ModelDropdown';
import FileUploadModal from './FileUploadModal';

export default function ChatInput({
  inputValue,
  setInputValue,
  onSendMessage,
  selectedModel,
  setSelectedModel,
  modelOptions,
  onFileUpload,
  loading,
  isTyping,
  selectedSession,
}: {
  inputValue: string;
  setInputValue: (v: string) => void;
  onSendMessage: () => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  modelOptions: { label: string; value: string }[];
  onFileUpload: (file: File) => void;
  loading: boolean;
  isTyping: boolean;
  selectedSession: string | null;
}) {
  const [showFileModal, setShowFileModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full border-t border-border bg-card/40">
      <div className="px-4 py-3">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Type your message here..."
            className="pr-24 pl-4 py-3 bg-muted/50 border-border focus:border-primary rounded-xl transition-all duration-200 glass w-full"
            disabled={loading || isTyping || !selectedSession}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setShowFileModal(true)}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={onSendMessage}
              disabled={!inputValue.trim() || loading || isTyping || !selectedSession}
              size="sm"
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <ModelDropdown
              modelOptions={modelOptions}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
            <Button variant="ghost" size="sm" className="text-xs h-auto p-1" disabled>
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
          </div>
        </div>
      </div>
      <FileUploadModal
        open={showFileModal}
        onClose={() => setShowFileModal(false)}
        onFileSelect={onFileUpload}
      />
    </div>
  );
}