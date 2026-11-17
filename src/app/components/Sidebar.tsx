"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserChats, deleteChat } from "../actions/chat";
import { toast } from "sonner";

const IconPlus = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconTrash = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconChat = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

interface SidebarProps {
  currentChatId: string;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  currentChatId,
  onNewChat,
  isOpen,
  onClose,
}: SidebarProps) {
  const [chats, setChats] = useState<{ id: string; title: string | null }[]>(
    [],
  );
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    async function fetchChats() {
      const data = await getUserChats();
      if (isMounted) setChats(data);
    }
    void fetchChats();
    return () => {
      isMounted = false;
    };
  }, [currentChatId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this chat?")) return;

    const res = await deleteChat(id);
    if (res.success) {
      toast.success("Chat deleted");
      setChats(await getUserChats());
      if (id === currentChatId) onNewChat();
    } else {
      toast.error("Failed to delete chat");
    }
  };

  return (
    <aside
      className={`
      fixed inset-y-0 left-0 z-50 bg-[#0b1120] text-slate-300 flex flex-col border-r border-slate-800 transform transition-all duration-300 ease-in-out overflow-hidden h-dvh
      md:relative md:h-full md:z-0
      ${isOpen ? "translate-x-0 w-65" : "-translate-x-full md:w-0"}
    `}
    >
      <div className="w-65 h-full flex flex-col">

        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-semibold text-white tracking-wide">
            CareerSync
          </span>
        </div>

        <div className="px-3 pb-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md"
          >
            <span className="font-medium text-sm">New Chat</span>
            <IconPlus />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2 scrollbar-thin scrollbar-thumb-slate-700">
          <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Recent
          </p>
          {chats.length === 0 ? (
            <p className="px-3 text-xs text-slate-500">No previous chats.</p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  router.push(`/dashboard/coach?chatId=${chat.id}`);
                  onClose();
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${chat.id === currentChatId ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <IconChat />
                  <span className="truncate text-sm">
                    {chat.title || "New Chat"}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                >
                  <IconTrash />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
