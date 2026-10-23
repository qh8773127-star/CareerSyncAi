"use server";

import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "../actions/Job";
import { MAX_EXTRACTIONS, MAX_CHATS } from "./constraints";

type QuotaType = "CHAT" | "EXTRACTION";

const getResetUserLimit = (
  userLimit: { lastReset: Date | string; chatCount: number; extractionCount: number },
  now: Date,
) => {
  const lastReset = new Date(userLimit.lastReset);
  const isNewDay = now.toDateString() !== lastReset.toDateString();

  return {
    isNewDay,
    chatCount: isNewDay ? 0 : userLimit.chatCount,
    extractionCount: isNewDay ? 0 : userLimit.extractionCount,
  };
};

export async function consumeQuota(
  type: QuotaType,
  requestId: string,
) {
  try {
    const userId = await requireAuth();
    const limit = type === "CHAT" ? MAX_CHATS : MAX_EXTRACTIONS;

    return await prisma.$transaction(async (tx) => {

      const userExists = await tx.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        return { success: false, message: "Session expired. Please log in again." };
      }

      let userLimit = await tx.userApiLimit.findUnique({ where: { userId } });
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (!userLimit) {
        userLimit = await tx.userApiLimit.create({
          data: { userId, chatCount: 0, extractionCount: 0, lastReset: now },
        });
      }

      const { isNewDay, chatCount, extractionCount } = getResetUserLimit(userLimit, now);

      if (isNewDay) {
        userLimit = await tx.userApiLimit.update({
          where: { userId },
          data: { chatCount: 0, extractionCount: 0, lastReset: now },
        });
      }

      const currentCount = type === "CHAT" ? chatCount : extractionCount;

      if (currentCount >= limit) {
        return {
          success: false,
          message: `Daily ${type.toLowerCase()} limit reached. Upgrade to Pro.`,
        };
      }
      await tx.quotaOperation.create({
        data: { userId, requestId, type, status: "CONSUMED", dayStart },
      });

      await tx.userApiLimit.update({
        where: { userId },
        data: {
          chatCount: type === "CHAT" ? chatCount + 1 : chatCount,
          extractionCount: type === "EXTRACTION" ? extractionCount + 1 : extractionCount,
        },
      });

      return { success: true, remaining: limit - (currentCount + 1) };
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[CONSUME_QUOTA_ERROR]:", error.message);
    } else {
      console.error("[CONSUME_QUOTA_ERROR]: Unknown error occurred");
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Duplicate request blocked." };
    }
    
    return { success: false, message: "Database error. Please try again later." };
  }
}

export async function refundQuota(requestId: string) {
  try {
    const userId = await requireAuth();

    return await prisma.$transaction(async (tx) => {
      const operation = await tx.quotaOperation.findUnique({
        where: { userId_requestId: { userId, requestId } },
      });

      if (!operation || operation.status !== "CONSUMED") {
        return { success: false, message: "Operation not found or already refunded." };
      }

      await tx.quotaOperation.update({
        where: { id: operation.id },
        data: { status: "REFUNDED" },
      });

      const userLimit = await tx.userApiLimit.findUnique({ where: { userId } });

      if (userLimit) {
        await tx.userApiLimit.update({
          where: { userId },
          data: {
            chatCount: operation.type === "CHAT" ? Math.max(0, userLimit.chatCount - 1) : userLimit.chatCount,
            extractionCount: operation.type === "EXTRACTION" ? Math.max(0, userLimit.extractionCount - 1) : userLimit.extractionCount,
          },
        });
      }

      return { success: true, message: "Quota refunded." };
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[REFUND_QUOTA_ERROR]:", error.message);
    }
    return { success: false, message: "Refund failed." };
  }
}

export const getApiLimitCount = async (type: QuotaType) => {
  try {
    const userId = await requireAuth();
    const userLimit = await prisma.userApiLimit.findUnique({ where: { userId } });

    if (!userLimit) return 0; 

    const now = new Date();
    const { isNewDay, chatCount, extractionCount } = getResetUserLimit(userLimit, now);

    if (isNewDay) return 0;

    return type === "CHAT" ? chatCount : extractionCount;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[GET_QUOTA_ERROR]:", error.message);
    }
    return 0; 
  }
};