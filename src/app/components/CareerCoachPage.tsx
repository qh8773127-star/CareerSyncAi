"use client";

import { useChat } from "@ai-sdk/react";
import { UIMessage, DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback } from "react";
import { Markdown } from "./Markdown";
import { toast } from "sonner";
import { getApiLimitCount } from "@/app/lib/quota";
import { MAX_CHATS, THINKING_MESSAGES } from "../lib/constraints";
import { getChatMessages } from "../actions/chat";
import { useSearchParams } from "next/navigation";
import { getUserChats } from "../actions/chat";

const IconLoader = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IconSparkles = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);
const IconSend = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);
const IconBot = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);
const IconUser = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const QUICK_PROMPTS = [
  "What are my top skills?",
  "Show me React jobs",
  "How is my application looking?",
];

export default function CareerCoachPage() {
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("chatId");

  const [chatId] = useState<string>(() => urlChatId || crypto.randomUUID());
  const [isLoadingHistory, setIsLoadingHistory] = useState(!!urlChatId);

  useEffect(() => {
    if (!urlChatId) {
      window.history.replaceState(null, "", `?chatId=${chatId}`);
    }
  }, [chatId, urlChatId]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId }, 
    }),
  });

  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [input, setInput] = useState("");
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const maxLimit = MAX_CHATS;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastErrorRef = useRef<string | null>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    async function loadHistory() {
      if (urlChatId) {
        setIsLoadingHistory(true);
        try {
          const history = await getChatMessages(urlChatId);
          const formattedHistory: UIMessage[] = history.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: msg.content }],
          }));

          setMessages(formattedHistory);
        } catch (err) {
          console.error("Failed to load history", err);
          toast.error("Failed to load previous conversation.");
        } finally {
          setIsLoadingHistory(false);
        }
      }
    }
    loadHistory();
  }, [urlChatId, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (error && error.message !== lastErrorRef.current) {
      lastErrorRef.current = error.message;
      toast.error(error.message || "Failed to fetch response.");
      setUsageCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
    }
    if (!error) lastErrorRef.current = null;
  }, [error]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialUsage = async () => {
      const count = await getApiLimitCount("CHAT");
      if (isMounted) setUsageCount(count);
    };
    fetchInitialUsage();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading || usageCount === null) return;
      if (usageCount >= maxLimit) {
        toast.error("Daily chat limit reached. Upgrade to Pro.");
        return;
      }

      setUsageCount((prev) => (prev !== null ? prev + 1 : 1));
      setThinkingIndex(0);
      lastErrorRef.current = null;
      sendMessage({ text });
      setInput("");
    },
    [isLoading, usageCount, maxLimit, sendMessage],
  );

  const isLimitReached = usageCount !== null && usageCount >= maxLimit;

  return (
    <div className="flex flex-col h-[85vh] max-w-5xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden relative">
      {/* 🌟 Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <IconSparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              AI Career Coach
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Powered by RAG & Groq
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Daily Limit
          </span>
          {usageCount === null ? (
            <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-md mt-1"></div>
          ) : (
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full mt-1 transition-all ${isLimitReached ? "bg-red-50 text-red-600 border border-red-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}
            >
              {usageCount} / {maxLimit} Used
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 scroll-smooth">
        {isLoadingHistory ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <IconLoader className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">
              Loading conversation...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <IconSparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              How can I help you today?
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mb-8">
              I know about your tracked jobs, resume, and career goals. Try
              asking me something specific.
            </p>

            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((m, index) => (
              <div
                key={m.id}
                className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <IconBot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm shadow-indigo-200"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                  }`}
                >
                  <div className="text-[15px] leading-relaxed space-y-2">
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        <Markdown key={i} content={part.text} />
                      ) : null,
                    )}
                  </div>
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <IconUser className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <IconBot className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-5 py-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                  <span className="text-sm text-slate-500 font-medium">
                    {THINKING_MESSAGES[thinkingIndex]}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "-0.3s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "-0.15s" }}
                    />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-slate-100 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder={
              isLimitReached
                ? "Daily limit reached. Upgrade to Pro."
                : "Message AI Coach..."
            }
            disabled={isLoading || isLimitReached || usageCount === null}
            className="flex-1 max-h-40 bg-transparent resize-none outline-none text-slate-800 placeholder:text-slate-400 px-3 py-2.5 text-[15px] disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={
              isLoading ||
              !input.trim() ||
              isLimitReached ||
              usageCount === null
            }
            className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed mb-0.5 mr-0.5 shadow-md"
          >
            {isLoading ? (
              <IconLoader className="w-5 h-5 animate-spin" />
            ) : (
              <IconSend className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
          AI Coach can make mistakes. Verify important info.
        </p>
      </div>
    </div>
  );
}
