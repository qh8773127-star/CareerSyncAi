"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Bold text
        strong: ({ children }) => (
          <strong className="font-bold text-slate-900">{children}</strong>
        ),
        // Italic
        em: ({ children }) => (
          <em className="italic text-slate-700">{children}</em>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        // Paragraphs
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        // Inline code
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block bg-slate-900 text-emerald-400 p-3 rounded-md my-2 text-xs overflow-x-auto">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          );
        },
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}