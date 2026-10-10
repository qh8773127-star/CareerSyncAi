"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";

export default function CareerCoachPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-[80vh] max-w-3xl mx-auto p-4 mt-6 border border-slate-200 rounded-xl bg-slate-50 shadow-sm">
      <div className="pb-4 border-b border-slate-200 mb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">
          CareerSync AI Coach
        </h1>
        <p className="text-sm text-slate-500">
          Ask me anything about your career development. .
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg border border-slate-100 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            Start by asking a question about your career, resume, or interview preparation.
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
                  {m.role === "user" ? "Tu" : "AI Coach"}
                </strong>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i}>{part.text}</span>
                    ) : null,
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
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
          className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
