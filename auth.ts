import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

type AppUser = {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; isAdmin?: boolean };
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");

        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD ?? "";

        if (!adminEmail || !adminPassword) return null;
        if (email !== adminEmail || password !== adminPassword) return null;

        const user: AppUser = {
          id: "admin",
          email,
          name: "Admin",
          isAdmin: true,
        };
        return user as any;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        (token as any).isAdmin = (user as any).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        (session.user as any).isAdmin = Boolean((token as any).isAdmin);
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;

