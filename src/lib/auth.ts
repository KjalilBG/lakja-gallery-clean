import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedAdminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const allowedSuperAdminEmails = (() => {
  const configuredEmails = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (configuredEmails.length > 0) {
    return configuredEmails;
  }

  return allowedAdminEmails.length > 0 ? [allowedAdminEmails[0]] : [];
})();

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function hasConfiguredAdminAllowlist() {
  return allowedAdminEmails.length > 0;
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  if (!hasConfiguredAdminAllowlist()) {
    return !isProduction();
  }

  return allowedAdminEmails.includes(email.toLowerCase());
}

export function isSuperAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  if (allowedSuperAdminEmails.length === 0) {
    return !isProduction();
  }

  return allowedSuperAdminEmails.includes(email.toLowerCase());
}

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
        hasAllowlist: hasConfiguredAdminAllowlist(),
        allowlistSize: allowedAdminEmails.length
      });

      if (account?.provider !== "google") {
        console.log("[auth] blocked non-google provider");
        return false;
      }

      if (!user.email) {
        console.log("[auth] blocked missing email");
        return false;
      }

      if (isProduction() && !hasConfiguredAdminAllowlist()) {
        console.error("[auth] blocked because ADMIN_EMAILS is not configured in production");
        return "/login?error=Configuration";
      }

      if (hasConfiguredAdminAllowlist() && !allowedAdminEmails.includes(user.email.toLowerCase())) {
        console.log("[auth] blocked email not in allowlist", {
          email: user.email.toLowerCase()
        });
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

      token.role = isAdminEmail(token.email) ? "ADMIN" : undefined;
      token.isSuperAdmin = isSuperAdminEmail(token.email);

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = typeof token.role === "string" ? token.role : undefined;
        session.user.isSuperAdmin = token.isSuperAdmin === true;
      }

      return session;
    }
  }
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
