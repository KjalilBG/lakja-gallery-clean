import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { UserRole } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const allowedAdminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const allowedStaffEmails = (process.env.STAFF_EMAILS ?? "")
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

export function isStaffEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  if (!hasConfiguredAdminAllowlist() && allowedStaffEmails.length === 0) {
    return !isProduction();
  }

  const normalizedEmail = email.toLowerCase();
  return allowedAdminEmails.includes(normalizedEmail) || allowedStaffEmails.includes(normalizedEmail);
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

async function getDbUserByEmail(email?: string | null) {
  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      email: email.toLowerCase()
    },
    select: {
      id: true,
      role: true,
      isActive: true
    }
  });
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
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar"
        }
      }
    }),
    CredentialsProvider({
      name: "Staff",
      credentials: {
        email: { label: "Correo", type: "email" },
        accessCode: { label: "Código", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const accessCode = credentials?.accessCode?.trim();

        if (!email || !accessCode) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            staffAccessCodeHash: true
          }
        });

        if (!user?.isActive || !user.staffAccessCodeHash) {
          return null;
        }

        if (!verifyPassword(accessCode, user.staffAccessCodeHash)) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role
        };
      }
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

      if (account?.provider === "credentials") {
        return true;
      }

      if (account?.provider !== "google") {
        console.log("[auth] blocked non-google provider");
        return false;
      }

      if (!user.email) {
        console.log("[auth] blocked missing email");
        return false;
      }

      const existingDbUser = await getDbUserByEmail(user.email);

      if (existingDbUser && existingDbUser.isActive === false) {
        return "/login?error=AccessDenied";
      }

      if (isProduction() && !hasConfiguredAdminAllowlist() && allowedStaffEmails.length === 0 && !existingDbUser) {
        console.error("[auth] blocked because ADMIN_EMAILS is not configured in production");
        return "/login?error=Configuration";
      }

      if (hasConfiguredAdminAllowlist() && !isStaffEmail(user.email) && !existingDbUser) {
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
        token.picture = ("image" in user && typeof user.image === "string" ? user.image : undefined) ?? token.picture;
      }

      if (user && "role" in user && typeof user.role === "string") {
        token.role = user.role;
      }

      if (!token.email) {
        return token;
      }

      const normalizedEmail = token.email.toLowerCase();
      const existingDbUser = await getDbUserByEmail(normalizedEmail);
      const role = isAdminEmail(token.email)
        ? UserRole.ADMIN
        : existingDbUser?.role ?? (isStaffEmail(token.email) ? UserRole.STAFF : undefined);

      const dbUser =
        role || existingDbUser
          ? await prisma.user.upsert({
              where: { email: normalizedEmail },
              update: {
                name: typeof token.name === "string" ? token.name : undefined,
                image: typeof token.picture === "string" ? token.picture : undefined,
                role: role ?? existingDbUser?.role ?? UserRole.STAFF
              },
              create: {
                email: normalizedEmail,
                name: typeof token.name === "string" ? token.name : null,
                image: typeof token.picture === "string" ? token.picture : null,
                role: role ?? UserRole.STAFF
              },
              select: {
                id: true,
                role: true,
                isActive: true
              }
            })
          : null;

      if (dbUser?.isActive === false) {
        token.role = undefined;
        return token;
      }

      token.sub = dbUser?.id ?? token.sub;
      token.role = dbUser?.role ?? (isAdminEmail(token.email) ? "ADMIN" : isStaffEmail(token.email) ? "STAFF" : undefined);
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
