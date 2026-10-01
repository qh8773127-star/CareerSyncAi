import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";  
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma), 
  session: { strategy: "jwt" }, 
  ...authConfig,
 callbacks: {
  
    session: ({ session, token }) => {

      if (session.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});