/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Search, BrainCircuit, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../../types';

interface GemiChatAppProps {
  systemTheme: { accentColor: string };
}

export default function GemiChatApp({ systemTheme }: GemiChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'مرحباً بك في نظام تشغيل جيميليث! أنا جيمي "Gemi"، المساعد الذكي المدمج في نواة النظام. كيف يمكنني خدمتك اليوم؟ يمكنك تمكين وضع التفكير العميق (Thinking Mode) لمناقشة المسائل المعقدة، أو تفعيل البحث عبر جوجل (Search Grounding) للحصول على معلومات حية ولحظية.',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle model change requirements
  useEffect(() => {
    if (useThinking) {
      setSelectedModel('gemini-3.1-pro-preview');
    } else {
      setSelectedModel('gemini-3.5-flash');
    }
  }, [useThinking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setErrorStatus(null);
    const userPrompt = inputValue;
    setInputValue('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Package conversation history for the backend
      const historyPayload = messages
        .filter((msg) => msg.id !== 'welcome')
        .map((msg) => ({
          role: msg.role,
          text: msg.text,
        }));

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt,
          history: historyPayload,
          model: selectedModel,
          thinking: useThinking,
          grounding: useSearch,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'فشل الاتصال بخادم الذكاء الاصطناعي');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: `gemi-${Date.now()}`,
        role: 'model',
        text: data.text,
        thought: data.thought,
        sources: data.sources,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error(error);
      setErrorStatus(error.message || 'حدث خطأ في جلب بيانات الذكاء الاصطناعي');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: 'تمت تهيئة محادثة جيمي "Gemi" بنجاح. كيف يمكنني مساعدتك الآن؟',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorStatus(null);
  };

  return (
    <div id="gemi-chat-app" className="flex flex-col h-full bg-slate-900 text-white font-sans overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="font-bold text-sm tracking-wide">نواة المساعد الذكي Gemi Copilot</span>
        </div>

        {/* Dynamic Engine Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Thinking Mode Toggle */}
          <button
            onClick={() => setUseThinking(!useThinking)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-300 ${
              useThinking
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500'
                : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700/50'
            }`}
            title="تفعيل التفكير العالي للذكاء الاصطناعي"
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${useThinking ? 'animate-spin' : ''}`} />
            <span>تفكير عميق</span>
          </button>

          {/* Search Grounding Toggle */}
          <button
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-300 ${
              useSearch
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500'
                : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700/50'
            }`}
            title="البحث باستخدام محرك بحث Google للحصول على معلومات دقيقة وحية"
          >
            <Search className="w-3.5 h-3.5" />
            <span>بحث مباشر</span>
          </button>

          {/* Model Display */}
          <span className="text-[10px] uppercase font-mono px-2 py-1 bg-indigo-950/40 text-indigo-300 rounded border border-indigo-900/50">
            {selectedModel}
          </span>

          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer transition-colors"
            title="مسح السجل"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                  msg.role === 'user'
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-indigo-900/30 border-indigo-700/50 text-indigo-300'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] flex flex-col space-y-1.5 ${msg.role === 'user' ? 'items-end' : ''}`}>
                {/* Header info */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <span>{msg.role === 'user' ? 'أنت' : 'جيمي جي بي'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Thought expansion block */}
                {msg.thought && (
                  <details className="w-full text-xs bg-indigo-950/20 border border-indigo-900/50 rounded-lg p-3 text-slate-300 group">
                    <summary className="flex items-center gap-2 cursor-pointer font-bold text-indigo-400 select-none outline-none">
                      <BrainCircuit className="w-3.5 h-3.5 group-open:animate-spin" />
                      <span>مسار التفكير العالي (أنقر لعرض تفاصيل التفكير العميق)</span>
                    </summary>
                    <div className="mt-2 pl-4 border-l-2 border-indigo-700/40 whitespace-pre-line text-slate-400 leading-relaxed max-h-48 overflow-y-auto">
                      {msg.thought}
                    </div>
                  </details>
                )}

                {/* Response Text Body */}
                <div
                  dir="auto"
                  className={`px-4 py-2.5 rounded-2xl whitespace-pre-line text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-150 rounded-tl-none border border-slate-700/40'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Search Grounding Sources UI */}
                {msg.sources && (
                  <div className="w-full mt-1.5 flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Search className="w-3 h-3" /> مراجع البحث:
                    </span>
                    {msg.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        <span className="truncate max-w-[120px]">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-950/20 border border-indigo-700/50 text-indigo-300">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-slate-500 font-mono">Gemi مشغول بالتفكير...</span>
                <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800 rounded-2xl rounded-tl-none border border-slate-700/40">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {errorStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-9050 text-rose-300 text-xs rounded-xl"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>خطأ: {errorStatus}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isLoading ? 'الرجاء الانتظاء...' : 'اكتب سؤالك أو أمرك الذكي هنا...'}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-white"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl cursor-pointer text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          title="إرسال"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
