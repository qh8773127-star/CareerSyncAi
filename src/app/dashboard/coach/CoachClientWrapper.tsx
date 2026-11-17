"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import CareerCoachPage from "@/app/components/CareerCoachPage";

export default function CoachClientWrapper({
  initialChatId,
}: {
  initialChatId?: string;
}) {
  const router = useRouter();
  const [fallbackChatId] = useState(() => crypto.randomUUID());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeChatId = initialChatId || fallbackChatId;

  useEffect(() => {
    if (!initialChatId) {
      router.replace(`/dashboard/coach?chatId=${fallbackChatId}`);
    }
  }, [initialChatId, fallbackChatId, router]);

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    router.push(`/dashboard/coach?chatId=${newId}`);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 flex w-full overflow-hidden bg-slate-50 z-30">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentChatId={activeChatId}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 h-full flex flex-col min-w-0 relative">
        <CareerCoachPage
          key={activeChatId}
          chatId={activeChatId}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
    </div>
  );
}
