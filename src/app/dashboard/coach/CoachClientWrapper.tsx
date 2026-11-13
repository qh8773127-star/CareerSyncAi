"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import CareerCoachPage from "@/app/components/CareerCoachPage";

export default function CoachClientWrapper({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();

  const [fallbackChatId] = useState(() => crypto.randomUUID());

  const activeChatId = initialChatId || fallbackChatId;

  useEffect(() => {
    if (!initialChatId) {
      router.replace(`/dashboard/coach?chatId=${fallbackChatId}`);
    }
  }, [initialChatId, fallbackChatId, router]);

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    router.push(`/dashboard/coach?chatId=${newId}`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white">
      <Sidebar
        currentChatId={activeChatId}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 h-full flex flex-col min-w-0">
        <CareerCoachPage key={activeChatId} chatId={activeChatId} />
      </div>
    </div>
  );
}