import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * NextAuth.js v4 — credentials provider, JWT (stateless) sessions.
 * Passwords are bcrypt-hashed. Sessions carry { id, email, role, name }.
 *
 * SECURITY:
 *  - Password hashing: bcrypt (server-side only; never returned to client).
 *  - JWT signed with NEXTAUTH_SECRET (env), stored in an HTTP-only cookie.
 *  - No database session table needed (JWT strategy) — good for serverless.
 *  - Sensitive fields (passwordHash) are never placed on the token or session.
 */

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const authOptions: NextAuthOptions = {
  // JWT (stateless) strategy. The signed JWT lives in an HTTP-only cookie.
  // maxAge = 30 days → the session persists across normal browser visits /
  // restarts, so an admin who logged in once isn't asked to sign in again on
  // the next visit (within 30 days). After that, the cookie expires and the
  // user must re-authenticate (requirement: "If the session has expired,
  // require authentication again").
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: "/login", newUser: "/register" },
  // Explicit cookie config — ensures the session cookie is persistent
  // (maxAge mirrors session.maxAge) and secure-by-default.
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days — persistent across browser restarts
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            passwordHash: true,
          },
        });
        if (!user || !user.passwordHash) return null;
        if (user.status !== "ACTIVE") return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

export type AppSession = {
  user: { id: string; email: string; name?: string | null; role: string };
};
