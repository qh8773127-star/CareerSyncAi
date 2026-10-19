import { prisma } from "./prisma";
import { requireAuth } from "../actions/Job";

export const MAX_EXTRACTIONS = 3;
export const MAX_CHATS = 15;

export async function consumeQuota(type: "chat" | "extraction") {
  const userId = await requireAuth();
  const limit = type === "chat" ? MAX_CHATS : MAX_EXTRACTIONS;

  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    let userLimit = await tx.userApiLimit.findUnique({
      where: { userId },
    });

    if (!userLimit) {
      userLimit = await tx.userApiLimit.create({
        data: {
          userId,
          chatCount: type === "chat" ? 1 : 0,
          extractionCount: type === "extraction" ? 1 : 0,
          lastReset: now,
        },
      });
      return { success: true, remaining: limit - 1 };
    }

    const isNewDay =
      now.toDateString() !== new Date(userLimit.lastReset).toDateString();
    if (isNewDay) {
      userLimit = await tx.userApiLimit.update({
        where: { userId },
        data: { chatCount: 0, extractionCount: 0, lastReset: now },
      });
    }

    const updateResult = await tx.userApiLimit.updateMany({
      where: {
        userId,
        ...(type === "chat"
          ? { chatCount: { lt: limit } }
          : { extractionCount: { lt: limit } }),
      },
      data: {
        ...(type === "chat"
          ? { chatCount: { increment: 1 } }
          : { extractionCount: { increment: 1 } }),
      },
    });

    if (updateResult.count === 0) {
      return {
        success: false,
        message: `Daily ${type} limit (${limit}) reached. Please try again tomorrow.`,
      };
    }

    const updatedLimit = await tx.userApiLimit.findUnique({
      where: { userId },
    });
    const remaining =
      type === "chat"
        ? limit - (updatedLimit?.chatCount || limit)
        : limit - (updatedLimit?.extractionCount || limit);

    return { success: true, remaining };
  });
}

export async function refundQuota(type: "chat" | "extraction") {
  try {
    const userId = await requireAuth();

    await prisma.userApiLimit.updateMany({
      where: {
        userId,
        ...(type === "chat"
          ? { chatCount: { gt: 0 } }
          : { extractionCount: { gt: 0 } }),
      },
      data: {
        ...(type === "chat"
          ? { chatCount: { decrement: 1 } }
          : { extractionCount: { decrement: 1 } }),
      },
    });
  } catch (error) {
    console.error("Failed to refund quota:", error);
  }
}
