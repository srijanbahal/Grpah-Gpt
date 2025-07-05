'use client';

import { useState, useRef, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import Sidebar from '@/components/Sidebar';
import ChatPanel from '@/components/ChatPanel';

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

const MODEL_OPTIONS = [
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
  { label: "GPT-4", value: "gpt-4" },
  { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
];

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedSession) handleNewSession();
  }, []);

  useEffect(() => {
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
    setIsTyping(true)
    let aiContent = '';
    try {
      await streamMessage(selectedSession, userMessage.content, (chunk) => {
        aiContent += chunk;
      });
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

  const handleFileUpload = (file: File) => {
    // Handle file upload logic here
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={20}
          minSize={12}
          maxSize={30}
          style={{
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'visible',
          }}
        >
          <Sidebar
            sessions={sessions}
            selectedSession={selectedSession}
            onNewSession={handleNewSession}
            onSwitchSession={handleSwitchSession}
            onDeleteSession={handleDeleteSession}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={40} className="flex flex-col h-full min-h-0">
          <ChatPanel
            messages={messages}
            isTyping={isTyping}
            loading={loading}
            error={error}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            modelOptions={MODEL_OPTIONS}
            onFileUpload={handleFileUpload}
            selectedSession={selectedSession}
            messagesEndRef={messagesEndRef}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}