"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";
import { Markdown } from "./Markdown";

const THINKING_MESSAGES = [
  "Thinking...",
  "Analyzing your question...",
  "Reviewing best practices...",
  "Crafting a response...",
];

export default function CareerCoachPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-[85vh] max-w-full mx-auto p-4 mt-6 border border-slate-200 rounded-xl bg-slate-50 shadow-sm">

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg border border-slate-100 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            Start by asking a question about your career, resume, or interview
            preparation.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  m.role === "user"
                    ? "bg-slate-900 text-white rounded-br-none"
                    : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
                }`}
              >
                <strong className="block text-xs opacity-50 mb-1">
                  {m.role === "user" ? "you" : "AI Coach"}
                </strong>
                <div className="text-sm leading-relaxed">
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      <Markdown key={i} content={part.text} />
                    ) : null,
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200">
                <strong className="block text-xs opacity-50 mb-2">
                  AI Coach
                </strong>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 animate-pulse">
                    {THINKING_MESSAGES[thinkingIndex]}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "-0.3s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "-0.15s" }}
                    />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            setThinkingIndex(0);
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="flex gap-3"
      >
        <input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
