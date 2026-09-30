// middleware.ts
import NextAuth from "next-auth";
import authConfig from "./app/auth.config";

// Sirf config (baghair Prisma ke) edge par run ho rahi hai
export const { auth: middleware } = NextAuth(authConfig);

// Yeh matcher tay karega ke kon kon se routes par guard khara hoga
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};