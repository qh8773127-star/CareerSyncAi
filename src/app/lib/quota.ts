import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "../actions/Job";

export const MAX_EXTRACTIONS = 3;
export const MAX_CHATS = 20;

export async function consumeQuota(type: "CHAT" | "EXTRACTION",requestId: string,) {
  const userId = await requireAuth();
  const limit = type === "CHAT" ? MAX_CHATS : MAX_EXTRACTIONS;

  try {
    return await prisma.$transaction(async (tx) => {
      let userLimit = await tx.userApiLimit.findUnique({
        where: { userId },
      });

      const now = new Date();
      const dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      if (!userLimit) {
        userLimit = await tx.userApiLimit.create({
          data: {
            userId,
            chatCount: 0,
            extractionCount: 0,
            lastReset: now,
          },
        });
      } else {
        const lastReset = new Date(userLimit.lastReset);
        const isNewDay = now.toDateString() !== lastReset.toDateString();

        if (isNewDay) {
          userLimit = await tx.userApiLimit.update({
            where: { userId },
            data: {
              chatCount: 0,
              extractionCount: 0,
              lastReset: now,
            },
          });
        }
      }

      const currentCount =
        type === "CHAT" ? userLimit.chatCount : userLimit.extractionCount;

      if (currentCount >= limit) {
        return {
          success: false,
          message: `Daily ${type.toLowerCase()} limit reached. Upgrade to Pro.`,
        };
      }

      await tx.quotaOperation.create({
        data: {
          userId,
          requestId,
          type,
          status: "CONSUMED",
          dayStart,
        },
      });

      await tx.userApiLimit.update({
        where: { userId },
        data: {
          chatCount:
            type === "CHAT" ? userLimit.chatCount + 1 : userLimit.chatCount,
          extractionCount:
            type === "EXTRACTION"
              ? userLimit.extractionCount + 1
              : userLimit.extractionCount,
        },
      });

      return { success: true, remaining: limit - (currentCount + 1) };
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "Duplicate request blocked by idempotency guard.",
      };
    }
    throw error;
  }
}
export async function refundQuota(requestId: string) {
  const userId = await requireAuth();

  return await prisma.$transaction(async (tx) => {
    const operation = await tx.quotaOperation.findUnique({
      where: { userId_requestId: { userId, requestId } },
    });

    if (!operation || operation.status !== "CONSUMED") {
      return {
        success: false,
        message: "Operation not found or already refunded.",
      };
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
          chatCount:
            operation.type === "CHAT"
              ? Math.max(0, userLimit.chatCount - 1)
              : userLimit.chatCount,
          extractionCount:
            operation.type === "EXTRACTION"
              ? Math.max(0, userLimit.extractionCount - 1)
              : userLimit.extractionCount,
        },
      });
    }

    return {
      success: true,
      message: "Quota successfully refunded due to AI failure.",
    };
  });
} 