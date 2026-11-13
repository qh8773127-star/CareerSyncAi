"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import CareerCoachPage from "@/app/components/CareerCoachPage";

export default function CoachClientWrapper({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const [fallbackChatId] = useState(() => crypto.randomUUID());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 👈 Mobile Sidebar State

  const activeChatId = initialChatId || fallbackChatId;

  useEffect(() => {
    if (!initialChatId) {
      router.replace(`/dashboard/coach?chatId=${fallbackChatId}`);
    }
  }, [initialChatId, fallbackChatId, router]);

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    router.push(`/dashboard/coach?chatId=${newId}`);
    setIsSidebarOpen(false); // Mobile par new chat par click karne ke baad sidebar band ho jaye
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white relative">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentChatId={activeChatId}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        <CareerCoachPage 
          key={activeChatId} 
          chatId={activeChatId} 
          onToggleSidebar={() => setIsSidebarOpen(true)} // 👈 Hamburger Menu trigger
        />
      </div>
    </div>
  );
}