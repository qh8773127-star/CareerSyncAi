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
const IconX = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6 6 18M6 6l12 12" />
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
    if (!confirm("Are you sure you want to delete this chat?")) return;

    const res = await deleteChat(id);
    if (res.success) {
      toast.success("Chat deleted");
      const updatedChats = await getUserChats();
      setChats(updatedChats);
      if (id === currentChatId) onNewChat();
    } else {
      toast.error("Failed to delete chat");
    }
  };

  const handleChatClick = (id: string) => {
    router.push(`/dashboard/coach?chatId=${id}`);
    onClose();
  };

  return (
    <aside
      className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shrink-0 transform transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}
    >
      <div className="p-3 flex items-center justify-between md:block">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
        >
          <span className="font-medium text-sm">New Chat</span>
          <IconPlus />
        </button>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-slate-400 hover:text-white ml-2"
        >
          <IconX />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 mt-2">
          Recent Chats
        </p>
        {chats.length === 0 ? (
          <p className="px-3 text-xs text-slate-500">No previous chats.</p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatClick(chat.id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${chat.id === currentChatId ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}
            >
              <div className="flex items-center gap-2 truncate">
                <IconChat />
                <span className="truncate text-sm font-medium">
                  {chat.title || "New Chat"}
                </span>
              </div>
              <button
                onClick={(e) => handleDelete(e, chat.id)}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-all ${chat.id === currentChatId ? "hover:bg-indigo-700" : "hover:bg-slate-700"}`}
              >
                <IconTrash />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
