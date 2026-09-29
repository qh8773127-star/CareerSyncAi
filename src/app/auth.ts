import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma"; 
import GitHub from "next-auth/providers/github"; // 1. GitHub provider import kar

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma), 
  session: { strategy: "jwt" }, 
  providers: [
    // 2. Engine ko GitHub provider pass kar
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ], 
});