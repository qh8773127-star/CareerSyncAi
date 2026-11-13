"use server";
import { prisma } from "@/app/lib/prisma";
import { requireAuth } from "@/app/actions/Job";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

export async function getChatMessages(chatId: string) {
  const userId = await requireAuth();
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) return [];
    return chat.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return [];
  }
}

export async function getUserChats() {
  try {
    const userId = await requireAuth();
    return await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    });
  } catch (error) {
    console.error("Failed to fetch user chats:", error);
    return [];
  }
}

export async function deleteChat(chatId: string) {
  try {
    const userId = await requireAuth();
    await prisma.chat.deleteMany({
      where: { id: chatId, userId },
    });
    revalidatePath("/dashboard/coach");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return { success: false, error: "Failed to delete chat" };
  }
}
