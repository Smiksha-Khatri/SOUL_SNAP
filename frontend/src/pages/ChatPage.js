import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Send, 
  Loader2, 
  Trash2, 
  Bookmark,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await chatApi.getHistory({ limit: 50 });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.send(input);
      const aiMessage = { 
        role: 'assistant', 
        content: response.data.response,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Check if we should prompt to save
      if (response.data.should_save) {
        setShowSavePrompt(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSaveMemory = async () => {
    try {
      await chatApi.saveMemory();
      toast.success('Conversation saved as a memory!');
      setShowSavePrompt(false);
    } catch (error) {
      toast.error('Failed to save memory');
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      try {
        await chatApi.clearHistory();
        setMessages([]);
        toast.success('Chat history cleared');
      } catch (error) {
        toast.error('Failed to clear history');
      }
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex h-screen bg-background" data-testid="chat-page">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-medium text-foreground" style={{ fontFamily: 'Manrope' }}>Soul</h1>
              <p className="text-xs text-muted-foreground">Your emotional companion</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="text-muted-foreground hover:text-destructive"
            data-testid="clear-chat-button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-medium text-foreground mb-2" style={{ fontFamily: 'Manrope' }}>
                  Hey there! I'm Soul.
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  I'm here to listen, chat, and support you. Share what's on your mind – big feelings, small wins, or just everyday thoughts.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'chat-user' 
                        : 'chat-assistant'
                    }`}
                    data-testid={`chat-message-${msg.role}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.created_at && (
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="chat-assistant px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Soul is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Save Memory Prompt */}
        <AnimatePresence>
          {showSavePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t border-border bg-secondary/30 p-4"
            >
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground">This conversation seems meaningful. Save it as a memory?</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSavePrompt(false)}
                  >
                    Not now
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveMemory}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="save-memory-button"
                  >
                    Save Memory
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="border-t border-border p-4 bg-white">
          <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what's on your mind..."
              className="flex-1 rounded-full px-6 h-12"
              disabled={loading}
              data-testid="chat-input"
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
              disabled={loading || !input.trim()}
              data-testid="chat-send-button"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
