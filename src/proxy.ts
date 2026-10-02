import NextAuth from "next-auth";
import authConfig from "./app/auth.config";

// Auth.js se strictly auth ka function nikal
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};