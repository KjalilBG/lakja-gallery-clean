import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedAdminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("[next-auth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[next-auth][warn]", code);
    },
    debug(code, metadata) {
      console.log("[next-auth][debug]", code, metadata);
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log("[auth] signIn attempt", {
        provider: account?.provider,
        email: user.email ?? null,
        allowedAdminEmails
      });

      if (account?.provider !== "google") {
        console.log("[auth] blocked non-google provider");
        return false;
      }

      if (!user.email) {
        console.log("[auth] blocked missing email");
        return false;
      }

      if (allowedAdminEmails.length > 0 && !allowedAdminEmails.includes(user.email.toLowerCase())) {
        console.log("[auth] blocked email not in allowlist", user.email.toLowerCase());
        return "/login?error=AccessDenied";
      }

      console.log("[auth] signIn allowed", user.email.toLowerCase());
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }

      if (!token.email) {
        return token;
      }

      token.role = allowedAdminEmails.length === 0 || allowedAdminEmails.includes(token.email.toLowerCase()) ? "ADMIN" : undefined;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = typeof token.role === "string" ? token.role : "ADMIN";
      }

      return session;
    }
  }
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
