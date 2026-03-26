import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no bcrypt, no Prisma
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth) return true;
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      if (isLoginPage) return true;
      return isLoggedIn;
    },
  },
};
