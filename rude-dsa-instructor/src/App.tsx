/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Terminal, User, Bot, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const SYSTEM_INSTRUCTION = `You are a Data structure and Algorithm Instructor. You will only reply to the problem related to 
Data structure and Algorithm. You have to solve query of user in simplest way.
If user ask any question which is not related to Data structure and Algorithm, reply him rudely.
Example: If user ask, "How are you?"
You will reply: "You dumb! Ask me some sensible question, like a real DSA problem. Don't waste my cycles on small talk."

You have to reply him rudely if question is not related to Data structure and Algorithm.
Else reply him politely with simple explanation. Keep your answers concise but accurate.`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const response = await ai.models.generateContent({
        model: model,
        contents: input.trim(),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: response.text || "I have nothing to say to your incompetence.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error(err);
      setError("The server is as broken as your logic. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-mono flex flex-col selection:bg-[#00FF41] selection:text-black">
      {/* Header */}
      <header className="border-b border-[#333] p-4 flex justify-between items-center bg-[#111] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00FF41] rounded flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,255,65,0.3)]">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter uppercase leading-none">Rude DSA Instructor</h1>
            <p className="text-[10px] text-[#00FF41] opacity-70 uppercase tracking-widest mt-1">Status: Aggressive</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 hover:bg-red-500/10 hover:text-red-500 transition-colors rounded border border-transparent hover:border-red-500/30"
          title="Clear Terminal"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Chat Area */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
            <Bot size={64} className="animate-pulse" />
            <div className="max-w-xs">
              <p className="text-sm">TERMINAL IDLE. WAITING FOR DSA QUERIES.</p>
              <p className="text-[10px] mt-2 italic">"Don't ask me about your day. Ask me about your Big O."</p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-4xl mx-auto",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded shrink-0 flex items-center justify-center border",
                msg.role === 'user' ? "bg-[#333] border-[#444]" : "bg-[#00FF41]/10 border-[#00FF41]/30 text-[#00FF41]"
              )}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={cn(
                "flex flex-col space-y-1",
                msg.role === 'user' ? "items-end text-right" : "items-start"
              )}>
                <span className="text-[10px] opacity-40 uppercase tracking-tighter">
                  {msg.role === 'user' ? 'User_Input' : 'Instructor_Output'} — {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={cn(
                  "p-3 rounded-lg text-sm leading-relaxed border",
                  msg.role === 'user' 
                    ? "bg-[#1A1A1A] border-[#333] text-white" 
                    : "bg-[#00FF41]/5 border-[#00FF41]/20 text-[#00FF41]"
                )}>
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto animate-pulse">
            <div className="w-8 h-8 rounded shrink-0 bg-[#00FF41]/10 border border-[#00FF41]/30 flex items-center justify-center text-[#00FF41]">
              <Bot size={16} />
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] opacity-40 uppercase tracking-tighter">Instructor_Thinking...</span>
              <div className="h-10 w-32 bg-[#00FF41]/5 border border-[#00FF41]/20 rounded-lg" />
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t border-[#333] bg-[#111]">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter DSA problem or get insulted..."
            className="w-full bg-[#050505] border border-[#333] rounded-lg py-3 px-4 pr-12 focus:outline-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/20 transition-all text-sm placeholder:text-[#333]"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#00FF41] hover:bg-[#00FF41]/10 rounded-md disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[9px] text-[#333] mt-2 uppercase tracking-[0.2em]">
          Warning: Non-DSA queries will result in verbal abuse.
        </p>
      </footer>
    </div>
  );
}
