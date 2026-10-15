import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "fds_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

const userSelect = { id: true, email: true, firstName: true, lastName: true, role: true } as const;

// Assainit les URLs de redirection post-authentification contre les attaques par redirection ouverte (Open Redirect).
export function sanitizeNextUrl(raw: unknown, defaultUrl = "/compte"): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return defaultUrl;
  // Interdire les URL relatives au protocole (//), antislashs (\) et sauts de ligne
  if (raw.startsWith("//") || raw.includes("\\") || raw.includes("\r") || raw.includes("\n")) {
    return defaultUrl;
  }
  try {
    const parsed = new URL(raw, "https://fil-de-sable.local");
    if (parsed.origin !== "https://fil-de-sable.local") return defaultUrl;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return defaultUrl;
  }
}

// À appeler uniquement depuis une Server Action ou un Route Handler (écriture de cookie).
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  // Nettoyage proactif des anciennes sessions expirées pour cet utilisateur
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  }).catch(() => {});

  const store = await cookies();
  // Rotation : le jeton précédent de ce navigateur (autre compte, session fixée…) est révoqué.
  const previousToken = store.get(COOKIE_NAME)?.value;
  if (previousToken) await prisma.session.deleteMany({ where: { token: previousToken } }).catch(() => {});

  await prisma.session.create({ data: { token, userId, expiresAt } });
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  store.delete(COOKIE_NAME);
}

// Dédupliqué par requête : le header et la page partagent le même résultat.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { select: userSelect } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Supprimer la session obsolète en base
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
});

export async function requireUser(next = "/compte"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(sanitizeNextUrl(next))}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/compte");
  return user;
}

