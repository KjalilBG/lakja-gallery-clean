import { prisma } from "@/lib/prisma";
import { sanitizeTextInput } from "@/lib/sanitize";

function normalizeOwnerEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getAdminNotebookByEmail(email: string) {
  const ownerEmail = normalizeOwnerEmail(email);

  if (!ownerEmail) {
    return {
      content: "",
      updatedAt: null as Date | null
    };
  }

  const notebook = await prisma.adminNotebook.findUnique({
    where: { ownerEmail },
    select: {
      content: true,
      updatedAt: true
    }
  });

  return {
    content: notebook?.content ?? "",
    updatedAt: notebook?.updatedAt ?? null
  };
}

export async function saveAdminNotebookByEmail(email: string, content: string) {
  const ownerEmail = normalizeOwnerEmail(email);
  const sanitizedContent = sanitizeTextInput(content, { preserveNewlines: true, maxLength: 50000 });

  if (!ownerEmail) {
    throw new Error("No se pudo identificar la cuenta del super admin.");
  }

  return prisma.adminNotebook.upsert({
    where: { ownerEmail },
    create: {
      ownerEmail,
      content: sanitizedContent
    },
    update: {
      content: sanitizedContent
    },
    select: {
      content: true,
      updatedAt: true
    }
  });
}
