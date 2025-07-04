'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Sparkles, 
  Compass, 
  Code, 
  GraduationCap,
  ChevronDown,
  Paperclip,
  ArrowUp,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { SettingsDropdown } from '@/components/settings-dropdown';

// --- Types ---
interface Session {
  id: string;
  title?: string;
}
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

// --- API Helpers ---
const API_BASE = 'http://localhost:8000';
async function createSession(): Promise<string> {
  const res = await fetch(`${API_BASE}/sessions`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create session');
  const data = await res.json();
  return data.session_id;
}
async function deleteSession(sessionId: string) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete session');
}
async function fetchHistory(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/history/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  const data = await res.json();
  // Map backend format to Message type
  return data.map((msg: any, idx: number) => ({
    id: msg.timestamp + '-' + idx,
    content: msg.content,
    isUser: msg.role === 'user',
    timestamp: msg.timestamp,
  }));
}
async function streamMessage(sessionId: string, content: string, onChunk: (chunk: string) => void): Promise<void> {
  const res = await fetch(`${API_BASE}/invoke?session_id=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ content }),
  });
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      onChunk(decoder.decode(value));
    }
  }
}

export default function Home() {
  // --- State ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    // On mount, create a session if none exists
    if (!selectedSession) {
      handleNewSession();
    }
  }, []);

  useEffect(() => {
    // Fetch history when session changes
    if (selectedSession) {
      setLoading(true);
      fetchHistory(selectedSession)
        .then(setMessages)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedSession) return;
    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    let aiContent = '';
    try {
      await streamMessage(selectedSession, userMessage.content, (chunk) => {
        aiContent += chunk;
        // Optionally, parse step tokens for richer UI
      });
      // After streaming, fetch updated history
      const updated = await fetchHistory(selectedSession);
      setMessages(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewSession = async () => {
    setError(null);
    try {
      const sessionId = await createSession();
      setSessions(prev => [...prev, { id: sessionId, title: `Session ${prev.length + 1}` }]);
      setSelectedSession(sessionId);
      setMessages([]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setError(null);
    try {
      await deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSwitchSession = (sessionId: string) => {
    setSelectedSession(sessionId);
  };

  // --- UI ---
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
        "w-64",
        "md:relative absolute z-50 h-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-lg font-semibold">GraphGPT</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewSession}
            title="New Session"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="mb-2 text-xs text-muted-foreground font-semibold px-2">Sessions</div>
            {sessions.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-4">No sessions yet.</div>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "flex items-center group rounded-lg px-2 py-2 mb-1 cursor-pointer transition-colors",
                  selectedSession === session.id ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => handleSwitchSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate flex-1 text-sm">
                  {session.title || session.id.slice(0, 8)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={e => { e.stopPropagation(); handleDeleteSession(session.id); }}
                  title="Delete session"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
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
        <div className="flex-1 flex flex-col relative">
          <div className="absolute inset-0 cosmic-gradient dark:cosmic-gradient opacity-50" />
          <div className="relative z-10 flex-1 flex flex-col">
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
                    <Button
                      variant="outline"
                      className="border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 transform hover:scale-105 glass"
                      onClick={handleNewSession}
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                      New Creative Session
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4">
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
              </ScrollArea>
            )}
            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card/40 rounded-t-full rounded-b-full mb-2 ">
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message here..."
                    className="pr-24 pl-4 py-3 bg-muted/50 border-border focus:border-primary rounded-xl transition-all duration-200 glass"
                    disabled={loading || isTyping || !selectedSession}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
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
                    <Button variant="ghost" size="sm" className="text-xs h-auto p-1" disabled>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Gemini 2.5 Flash
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-auto p-1" disabled>
                      <Search className="h-3 w-3 mr-1" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}