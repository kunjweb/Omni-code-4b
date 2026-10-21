/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Terminal, Sparkles, Loader2, Database, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: msg.content + parsed.text }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error('Error parsing stream data', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during chat:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: 'An error occurred while connecting to the model.' }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-gray-200 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#161b22] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              Nexus 4B <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-500/20 text-blue-300 rounded-sm">FP32</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">Ultra-Fast Coding & General Purpose LLM</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-gray-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>4B Params</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-500/70" />
            <span>Sub-100ms TTFT</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
            <div className="w-16 h-16 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <Terminal className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">System Online.</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Trained on the largest comprehensive datasets. I am a highly optimized, full-precision all-rounder model with top-tier capabilities in software engineering and system architecture.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8">
              {[
                "Write a fast sorting algorithm in Rust",
                "Explain how React Server Components work",
                "Design a scalable microservices architecture",
                "Debug this TypeScript error for me"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-left px-4 py-3 bg-[#161b22] border border-gray-800 rounded-xl hover:bg-[#1f2630] hover:border-gray-700 transition-colors text-sm text-gray-300 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${
                    msg.role === 'user'
                      ? 'bg-blue-600/20 border-blue-600/30'
                      : 'bg-[#161b22] border-gray-700'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <span className="text-xs font-semibold text-blue-300">U</span>
                  ) : (
                    <Cpu className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#161b22] border border-gray-800 text-gray-300'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-800 max-w-none prose-sm">
                      {msg.content === '' ? (
                        <div className="flex items-center gap-2 text-gray-500 h-6">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-mono">Generating response...</span>
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 sm:p-6 bg-[#0d1117] shrink-0 border-t border-gray-900 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-[#161b22] border border-gray-700 rounded-2xl overflow-hidden focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder="Ask anything or request some code..."
              className="flex-1 bg-transparent px-5 py-4 outline-none text-gray-200 placeholder:text-gray-500 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3 text-[10px] text-gray-600 font-mono flex items-center justify-center gap-2">
            <span>Powered by Gemini API</span>
            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
            <span>Nexus FP32 Pipeline</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
