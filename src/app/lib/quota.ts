"use server";

import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "../actions/Job";
import { MAX_EXTRACTIONS, MAX_CHATS } from "./constraints";
import { redis } from "./redis";

type QuotaType = "CHAT" | "EXTRACTION";

type UserLimit = {
  lastReset: Date;
  chatCount: number;
  extractionCount: number;
};

function isNewCalendarDay(lastReset: Date, now: Date): boolean {
  return lastReset.toDateString() !== now.toDateString();
}

function getCount(userLimit: UserLimit, type: QuotaType): number {
  return type === "CHAT" ? userLimit.chatCount : userLimit.extractionCount;
}

function getMaxLimit(type: QuotaType): number {
  return type === "CHAT" ? MAX_CHATS : MAX_EXTRACTIONS;
}

function getCountField(type: QuotaType): "chatCount" | "extractionCount" {
  return type === "CHAT" ? "chatCount" : "extractionCount";
}

function getQuotaCacheKey(userId: string, type: QuotaType): string {
  return `api_limit:${userId}:${type}`;
}

export async function consumeQuota(type: QuotaType, requestId: string) {
  try {
    const userId = await requireAuth();

    if (!requestId?.trim()) {
      return { success: false as const, error: "Invalid request ID." };
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const txResult = await prisma.$transaction(
      async (tx) => {
        await tx.userApiLimit.upsert({
          where: { userId },
          create: { userId, chatCount: 0, extractionCount: 0, lastReset: now },
          update: {},
        });

        const userLimit = await tx.userApiLimit.findUnique({
          where: { userId },
        });

        if (!userLimit) {
          throw new Error("Unable to load user quota.");
        }

        let currentChatCount = userLimit.chatCount;
        let currentExtractionCount = userLimit.extractionCount;

        if (isNewCalendarDay(userLimit.lastReset, now)) {
          currentChatCount = 0;
          currentExtractionCount = 0;

          await tx.userApiLimit.update({
            where: { userId },
            data: { chatCount: 0, extractionCount: 0, lastReset: now },
          });
        }

        const currentCount =
          type === "CHAT" ? currentChatCount : currentExtractionCount;
        const maxLimit = getMaxLimit(type);

        if (currentCount >= maxLimit) {
          return {
            success: false as const,
            error: "Daily limit reached.",
            remaining: 0,
          };
        }

        await tx.quotaOperation.create({
          data: { userId, requestId, type, status: "CONSUMED", dayStart },
        });

        const updatedLimit = await tx.userApiLimit.update({
          where: { userId },
          data:
            type === "CHAT"
              ? { chatCount: { increment: 1 } }
              : { extractionCount: { increment: 1 } },
        });

        return {
          success: true as const,
          remaining: Math.max(0, maxLimit - getCount(updatedLimit, type)),
          used: getCount(updatedLimit, type),
          limit: maxLimit,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (txResult.success) {
      try {
        await redis.del(getQuotaCacheKey(userId, type));
      } catch (redisError) {
        console.error("[CONSUME_CACHE_INVALIDATE_ERROR]:", redisError);
      }
    }

    return txResult;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false as const, error: "Duplicate request blocked." };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false as const,
        error: "Transaction conflict. Please try again.",
      };
    }

    console.error("[CONSUME_QUOTA_ERROR]:", error);
    return {
      success: false as const,
      error: "Unable to verify or consume quota.",
    };
  }
}

export async function refundQuota(requestId: string) {
  try {
    const userId = await requireAuth();

    if (!requestId?.trim()) {
      return { success: false as const };
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const operation = await tx.quotaOperation.findUnique({
        where: { userId_requestId: { userId, requestId } },
      });

      if (!operation || operation.status !== "CONSUMED") {
        return { success: false as const };
      }

      const refundResult = await tx.quotaOperation.updateMany({
        where: { userId, requestId, status: "CONSUMED" },
        data: { status: "REFUNDED" },
      });

      if (refundResult.count !== 1) {
        return { success: false as const };
      }

      const userLimit = await tx.userApiLimit.findUnique({ where: { userId } });

      if (!userLimit) {
        throw new Error("User quota record not found during refund.");
      }

      const now = new Date();

      if (isNewCalendarDay(userLimit.lastReset, now)) {
        return {
          success: true as const,
          type: operation.type as QuotaType,
        };
      }

      const field = getCountField(operation.type as QuotaType);
      const currentCount = userLimit[field];

      await tx.userApiLimit.update({
        where: { userId },
        data: { [field]: Math.max(0, currentCount - 1) },
      });

      return {
        success: true as const,
        type: operation.type as QuotaType,
      };
    });
    if (txResult.success) {
      try {
        await redis.del(getQuotaCacheKey(userId, txResult.type));
      } catch (redisError) {
        console.error("[REFUND_CACHE_INVALIDATE_ERROR]:", redisError);
      }
    }

    return { success: txResult.success };
  } catch (error) {
    console.error("[REFUND_QUOTA_ERROR]:", error);
    return { success: false as const };
  }
}

export async function getApiLimitCount(type: QuotaType): Promise<number> {
  const userId = await requireAuth();
  const cacheKey = getQuotaCacheKey(userId, type);
  try {
    const cached = await redis.get<number | string>(cacheKey);
    if (cached !== null && cached !== undefined) {
      const parsed = Number(cached);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  } catch (redisError) {
    console.error("[GET_QUOTA_CACHE_READ_ERROR]:", redisError);

  }

  const now = new Date();

  const finalCount = await prisma.$transaction(async (tx) => {
    const userLimit = await tx.userApiLimit.upsert({
      where: { userId },
      create: { userId, chatCount: 0, extractionCount: 0, lastReset: now },
      update: {},
    });

    if (isNewCalendarDay(userLimit.lastReset, now)) {
      await tx.userApiLimit.update({
        where: { userId },
        data: { chatCount: 0, extractionCount: 0, lastReset: now },
      });
      return 0;
    }

    return getCount(userLimit, type);
  });

  // 3. Cache write — best effort
  try {
    await redis.set(cacheKey, finalCount, { ex: 300 });
  } catch (redisError) {
    console.error("[GET_QUOTA_CACHE_WRITE_ERROR]:", redisError);
  }

  return finalCount;
}