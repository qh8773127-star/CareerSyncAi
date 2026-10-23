"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";
import { Markdown } from "./Markdown";
import { toast } from "sonner";
import { getApiLimitCount } from "@/app/lib/quota";
import { MAX_CHATS } from "../lib/constraints"; 

const THINKING_MESSAGES = [
  "Thinking...",
  "Analyzing your question...",
  "Reviewing best practices...",
  "Crafting a response...",
];

export default function CareerCoachPage() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [input, setInput] = useState("");
  
  const [usageCount, setUsageCount] = useState(0);

  const maxLimit = MAX_CHATS; 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);


  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to fetch response.");
    }
  }, [error]);


  useEffect(() => {
    const fetchInitialUsage = async () => {
      try {
        const count = await getApiLimitCount("CHAT");
        setUsageCount(count);
      } catch (err) {
        console.error("Failed to fetch quota:", err);
      }
    };
    fetchInitialUsage();
  }, []); 

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
  
    setUsageCount((prev) => prev + 1);
    
    setThinkingIndex(0);
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-[85vh] max-w-8xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">AI Career Coach</h1>
            <p className="text-xs text-slate-500 font-medium">Always here to help you grow</p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Daily Limit</span>
          <span className={`text-sm font-semibold px-2.5 py-1 rounded-md mt-1 ${
            usageCount >= maxLimit 
              ? "bg-red-50 text-red-600" 
              : "bg-blue-50 text-blue-600" 
          }`}>
            {usageCount} / {maxLimit} Used
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">How can I help you today?</h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Ask me about resume reviews, interview preparation, or career strategies.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                  m.role === "user"
                    ? "bg-slate-900 text-white rounded-tr-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                }`}>
                  <strong className={`block text-[10px] uppercase tracking-wider mb-1.5 font-bold ${
                    m.role === "user" ? "text-slate-300" : "text-blue-500"
                  }`}>
                    {m.role === "user" ? "You" : "AI Coach"}
                  </strong>
                  <div className="text-[15px] leading-relaxed space-y-2">
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        <Markdown key={i} content={part.text} />
                      ) : null,
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-5 py-4 bg-white border border-slate-200 shadow-sm">
                  <strong className="block text-[10px] uppercase tracking-wider mb-2 font-bold text-blue-500">
                    AI Coach
                  </strong>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-medium">
                      {THINKING_MESSAGES[thinkingIndex]}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "-0.3s" }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "-0.15s" }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-slate-800 focus-within:border-transparent transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={usageCount >= maxLimit ? "Daily limit reached. Upgrade to Pro." : "Message AI Coach..."}
            disabled={isLoading || usageCount >= maxLimit} 
            className="flex-1 max-h-[120px] bg-transparent resize-none outline-none text-slate-800 placeholder:text-slate-400 px-3 py-2 text-[15px] disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || usageCount >= maxLimit}
            className="shrink-0 w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed mb-0.5 mr-0.5"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-center text-[11px] text-slate-400 mt-2">
          AI Coach can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
}