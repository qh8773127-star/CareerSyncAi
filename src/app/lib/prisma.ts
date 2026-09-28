import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Global object mein Prisma ko lock karna taake hot-reload par duplicate connections na banein
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Sirf development environment mein global reuse hoga, production mein normal chalega
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}