import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Calendar,
  Bot,
  User as UserIcon,
  Trash2,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Loader,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  X,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  date?: string;
  timestamp: Date;
  isError?: boolean;
  isFallback?: boolean;
  fallbackSource?: 'gemini' | 'local' | null;
  webhookError?: string | null;
}

interface ChatbotSectionProps {
  currentUser: User | null;
  isLoggedIn: boolean;
  triggerToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ChatbotSection({ currentUser, isLoggedIn, triggerToast }: ChatbotSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Update welcome message dynamically based on login status
  useEffect(() => {
    const welcomeText = `👋 Hello ${isLoggedIn && currentUser ? `@${currentUser.username}` : 'Visitor'}! Welcome to the **PoolCodes Assistant**.\n\nType your question about coupon codes, soccer predictions, or matches below. I'm here to help you analyze match statistics, find coupons, and predict soccer draws!`;
    
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: welcomeText,
        timestamp: new Date()
      }
    ]);
  }, [isLoggedIn, currentUser?.id]);

  const [inputText, setInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (textToSend: string, dateToSend: string) => {
    if (!textToSend.trim() && !dateToSend) {
      triggerToast('Please select a date or type a message.', 'error');
      return;
    }

    const messageText = textToSend.trim() || `Inquiry for selected date: ${dateToSend}`;
    const userMessageId = `msg-user-${Date.now()}`;
    const newUserMessage: Message = {
      id: userMessageId,
      sender: 'user',
      text: messageText,
      date: dateToSend || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          date: dateToSend || '',
          user: currentUser ? {
            username: currentUser.username,
            email: currentUser.email,
            role: currentUser.role
          } : {
            username: 'guest_user',
            email: 'guest@poolcodes.com',
            role: 'user'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const data = await response.json();

      const botMessageId = `msg-bot-${Date.now()}`;
      const isError = !data.success || data.isError || false;
      const textToDisplay = data.reply || (isError ? 'Message failed to send.' : 'No response payload received from webhook.');

      const newBotMessage: Message = {
        id: botMessageId,
        sender: 'bot',
        text: textToDisplay,
        timestamp: new Date(),
        isError: isError,
        isFallback: data.isFallback,
        fallbackSource: data.fallbackSource,
        webhookError: data.webhookError
      };

      setMessages(prev => [...prev, newBotMessage]);
      if (isError) {
        triggerToast(textToDisplay, 'error');
      } else {
        triggerToast('Response received successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Chatbot endpoint request failure:', err);
      const errorBotMessage: Message = {
        id: `msg-err-${Date.now()}`,
        sender: 'bot',
        text: 'Message failed to send.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorBotMessage]);
      triggerToast('Message failed to send.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText, selectedDate);
  };

  const handlePresetInquiry = (presetText: string, presetDate: string) => {
    if (isLoading) return;
    setSelectedDate(presetDate);
    handleSendMessage(presetText, presetDate);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: `🧹 Chat history cleared!\n\nHow can I help you with coupon codes, soccer matches, or draw predictions today?`,
        timestamp: new Date()
      }
    ]);
    triggerToast('Chat history reset successfully.', 'info');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Preset query templates for easy testing
  const presets = [
    {
      label: 'Aussie Week 49 Predictions',
      text: 'Query soccer draw predictions and fixture summaries for Aussie Season Week 49.',
      date: '2026-07-04'
    },
    {
      label: 'UK Pool Coupon Codes',
      text: 'Fetch professional coupon codes sheets and bookmaker forecast ratios.',
      date: '2026-05-02'
    }
  ];

  return (
    <>
      {/* Floating Toggle Button (Always Pinned in bottom right) */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center border-2 border-emerald-350 ${
            isOpen ? 'rotate-90 bg-rose-500 hover:bg-rose-400 text-white border-rose-350' : ''
          }`}
          title={isOpen ? "Close Assistant" : "Open Arena AI Assistant"}
          id="global-chatbot-toggle-button"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-550 rounded-full border border-slate-900 animate-pulse"></span>
            </div>
          )}
        </button>
      </div>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[998] w-[350px] sm:w-[400px] h-[580px] max-h-[80vh] bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            id="global-chatbot-container"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans font-bold text-sm text-slate-100 tracking-tight">
                      PoolCodes Assistant
                    </h3>
                    <span className="flex items-center gap-1 text-[9.5px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Your personal draw & coupon advisor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearChat}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-850 rounded-md transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-850 rounded-md transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Body Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0 bg-slate-950/40">
              <div className="space-y-4 flex-1 font-sans">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Message content */}
                    <div className="flex flex-col gap-1 w-full">
                      <div className={`px-4 py-2.5 rounded-2xl text-[12.5px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                          : msg.isError
                          ? 'bg-rose-950/30 border border-rose-900/30 text-rose-100 rounded-tl-none'
                          : 'bg-slate-900/95 border border-slate-800/80 text-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}

                        {msg.date && (
                          <div className="mt-2 pt-2 border-t border-slate-800/40 flex items-center gap-1.5 text-[9.5px] text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Target Date: <strong className="text-white font-medium">{msg.date}</strong></span>
                          </div>
                        )}

                        {msg.isFallback && (
                          <div className="mt-2 pt-2 border-t border-slate-800/40 text-[10px] text-amber-400 flex flex-col gap-1 select-none">
                            <span className="flex items-center gap-1 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Fell back to {msg.fallbackSource === 'gemini' ? 'Gemini AI Assistant' : 'Offline Mode'}
                            </span>
                            {msg.webhookError && (
                              <p className="text-[9.5px] text-slate-400 font-sans leading-snug bg-slate-950/60 p-2 rounded border border-slate-850/80">
                                <strong>Reason:</strong> {msg.webhookError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <span className={`text-[9px] text-slate-500 px-1 font-medium ${
                        msg.sender === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Loader state */}
                {isLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="flex flex-col gap-1">
                      <div className="px-4 py-2.5 bg-slate-900/95 border border-slate-800 text-slate-450 rounded-2xl rounded-tl-none text-[12.5px] flex items-center gap-2">
                        <Loader className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Form Footer */}
            <form onSubmit={onSubmit} className="p-3 bg-slate-900 border-t border-slate-850 shrink-0">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 rounded-xl px-3 py-1.5 transition-all">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask about coupon codes or soccer matches..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none border-none p-0 focus:ring-0"
                    disabled={isLoading}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-550 active:scale-95 disabled:scale-100 rounded-xl text-slate-950 transition duration-150 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
