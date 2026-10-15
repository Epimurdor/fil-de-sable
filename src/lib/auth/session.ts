import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, clearCookie, cookieBaseOptions } from "@/lib/security/cookies";

const SESSION_DAYS = 30;
// Un jeton émis par createSession fait 43 caractères : au-delà, c'est forcément une valeur forgée.
const MAX_TOKEN_LENGTH = 128;

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

const userSelect = { id: true, email: true, firstName: true, lastName: true, role: true } as const;

// Le cookie porte le jeton brut ; la base n'en garde que l'empreinte SHA-256. Une lecture de la
// table Session (sauvegarde, accès à l'hébergeur, injection) ne permet donc pas de rejouer une session.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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
  const previousToken = store.get(SESSION_COOKIE)?.value;
  if (previousToken && previousToken.length <= MAX_TOKEN_LENGTH) {
    await prisma.session.deleteMany({ where: { token: hashToken(previousToken) } }).catch(() => {});
  }

  await prisma.session.create({ data: { token: hashToken(token), userId, expiresAt } });
  store.set(SESSION_COOKIE, token, { ...cookieBaseOptions, expires: expiresAt });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && token.length <= MAX_TOKEN_LENGTH) {
    await prisma.session.deleteMany({ where: { token: hashToken(token) } }).catch(() => {});
  }
  await clearCookie(SESSION_COOKIE);
}

// Dédupliqué par requête : le header et la page partagent le même résultat.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > MAX_TOKEN_LENGTH) return null;
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
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
