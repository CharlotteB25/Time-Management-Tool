import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      name: "Name Login",
      credentials: {
        userId: { label: "User ID", type: "text" },
        password: { label: "Password (admin only)", type: "password" },
      },
      async authorize(credentials) {
        const userId = credentials?.userId?.toString();
        const password = credentials?.password?.toString();

        if (!userId) return null;

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || !user.isActive) return null;

        // 🔐 Admin requires password
        if (user.role === "ADMIN") {
          if (!password) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
        }

        return {
          id: user.id,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        // @ts-expect-error
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error
        session.user.id = token.uid;
        // @ts-expect-error
        session.user.role = token.role;
      }
      return session;
    },
  },
});
