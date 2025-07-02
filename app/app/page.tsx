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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { SettingsDropdown } from '@/components/settings-dropdown';

interface ChatThread {
  id: string;
  title: string;
  timestamp: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const sampleThreads: ChatThread[] = [
  { id: '1', title: 'Flash Fiction Prompts', timestamp: 'Yesterday' },
  { id: '2', title: 'Creative Writing Ideas', timestamp: 'Yesterday' },
  { id: '3', title: 'Story Development', timestamp: 'Yesterday' },
  { id: '4', title: 'Character Building', timestamp: 'Yesterday' },
  { id: '5', title: 'Plot Structures', timestamp: 'Yesterday' },
  { id: '6', title: 'Dialogue Techniques', timestamp: '2 days ago' },
  { id: '7', title: 'World Building', timestamp: '2 days ago' },
];

const sampleQuestions = [
  'How does AI work?',
  'Are black holes real?',
  'How many Rs are in the word "strawberry"?',
  'What is the meaning of life?'
];

const actionButtons = [
  { icon: Sparkles, label: 'Create', color: 'text-purple-400' },
  { icon: Compass, label: 'Explore', color: 'text-blue-400' },
  { icon: Code, label: 'Code', color: 'text-green-400' },
  { icon: GraduationCap, label: 'Learn', color: 'text-orange-400' },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [yesterdayOpen, setYesterdayOpen] = useState(true);
  const [twoDaysAgoOpen, setTwoDaysAgoOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm a demo AI assistant. This is where the AI response would appear with smooth animations and proper formatting. The cosmic background creates a beautiful atmosphere for our conversation!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const startNewChat = () => {
    setSelectedThread(null);
    setMessages([]);
    setInputValue('');
  };

  const yesterdayThreads = sampleThreads.filter(thread => thread.timestamp === 'Yesterday');
  const twoDaysAgoThreads = sampleThreads.filter(thread => thread.timestamp === '2 days ago');

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-0",
        "md:relative absolute z-50 h-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-lg font-semibold"> GraphGPT </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <Button 
            onClick={startNewChat}
            className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your threads..."
              className="pl-10 bg-muted/50 border-border focus:border-primary transition-colors duration-200"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {/* Yesterday Section */}
            <Collapsible open={yesterdayOpen} onOpenChange={setYesterdayOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                <span>Yesterday</span>
                <ChevronRight className={cn("h-3 w-3 transition-transform", yesterdayOpen && "rotate-90")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {yesterdayThreads.map((thread) => (
                  <Button
                    key={thread.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left h-auto p-3 hover:bg-muted transition-colors duration-200",
                      selectedThread === thread.id && "bg-muted"
                    )}
                    onClick={() => setSelectedThread(thread.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="truncate text-sm">{thread.title}</span>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* 2 Days Ago Section */}
            <Collapsible open={twoDaysAgoOpen} onOpenChange={setTwoDaysAgoOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                <span>2 days ago</span>
                <ChevronRight className={cn("h-3 w-3 transition-transform", twoDaysAgoOpen && "rotate-90")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {twoDaysAgoThreads.map((thread) => (
                  <Button
                    key={thread.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left h-auto p-3 hover:bg-muted transition-colors duration-200",
                      selectedThread === thread.id && "bg-muted"
                    )}
                    onClick={() => setSelectedThread(thread.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="truncate text-sm">{thread.title}</span>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur-sm ">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className={cn(sidebarOpen && "md:hidden")}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button> */}
          
          <div className="flex items-center space-x-2 ">
            <SettingsDropdown />
            <ModeToggle />
          </div>
        </div>

        {/* Chat Area with Cosmic Background */}
        <div className="flex-1 flex flex-col relative">
          <div className="absolute inset-0 cosmic-gradient dark:cosmic-gradient opacity-50" />
          <div className="relative z-10 flex-1 flex flex-col">
            {messages.length === 0 ? (
              /* Welcome Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-8">
                <div className="text-center space-y-6 max-w-2xl w-full">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent animate-float">
                    How can I help you?
                  </h1>
                  
                  {/* These are Some sample options(Createm, explore and all) */}
                  <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                    {actionButtons.map((button, index) => (
                      <Button
                        key={button.label}
                        variant="outline"
                        className="border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 transform hover:scale-105 glass"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <button.icon className={cn("h-4 w-4 mr-2", button.color)} />
                        {button.label}
                      </Button>
                    ))}
                  </div>
                    
                  <div className="space-y-3 mt-8">
                    {sampleQuestions.map((question, index) => (
                      <button
                        key={question}
                        onClick={() => handleQuestionClick(question)}
                        className="block w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 transform hover:scale-[1.02] border border-border hover:border-primary/50 glass"
                        style={{ animationDelay: `${(index + 4) * 100}ms` }}
                      >
                        <span className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                          {question}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Messages */
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
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" className="text-xs h-auto p-1">
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Gemini 2.5 Flash
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-auto p-1">
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