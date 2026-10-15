"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";
import { WEAK_PASSWORD_MESSAGE, isWeakPassword } from "./password-policy";
import { createSession, destroySession, sanitizeNextUrl } from "./session";
import { attachCartToUser } from "@/lib/cart/cart";
import { CART_COOKIE, clearCookie } from "@/lib/security/cookies";
import {
  clearRateLimit,
  consumeRateLimit,
  getClientIp,
  peekRateLimit,
  tooManyAttemptsMessage,
  type RateLimitRule,
} from "@/lib/security/rate-limit";

export type AuthState = { error?: string };

// Anti brute-force et anti-épuisement CPU (scrypt) : limites appliquées AVANT tout calcul de hash.
const LOGIN_PER_IP: RateLimitRule = { limit: 5, windowMs: 60_000 };
const LOGIN_FAILURES_PER_EMAIL: RateLimitRule = { limit: 5, windowMs: 15 * 60_000 };
const REGISTER_PER_IP: RateLimitRule = { limit: 5, windowMs: 15 * 60_000 };

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Adresse e-mail trop longue.")
  .pipe(z.email("Adresse e-mail invalide."));

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Ton prénom nous manque.").max(60, "Prénom trop long (60 caractères max)."),
  lastName: z.string().trim().min(1, "Ton nom nous manque.").max(60, "Nom trop long (60 caractères max)."),
  email: emailField,
  password: z
    .string()
    .min(8, "8 caractères minimum pour le mot de passe.")
    .max(128, "Mot de passe trop long (128 caractères max)."),
});

const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Mot de passe manquant.")
    .max(128, "Mot de passe trop long (128 caractères max)."),
});

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ipLimit = consumeRateLimit(`register:ip:${await getClientIp()}`, REGISTER_PER_IP);
  if (!ipLimit.ok) return { error: tooManyAttemptsMessage(ipLimit.retryAfterSeconds) };

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { email, password, firstName, lastName } = parsed.data;
  if (isWeakPassword(password, email)) return { error: WEAK_PASSWORD_MESSAGE };

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "Un compte existe déjà avec cette adresse." };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName },
  });
  await createSession(user.id);
  await attachCartToUser(user.id);
  redirect(sanitizeNextUrl(formData.get("next")));
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ipLimit = consumeRateLimit(`login:ip:${await getClientIp()}`, LOGIN_PER_IP);
  if (!ipLimit.ok) return { error: tooManyAttemptsMessage(ipLimit.retryAfterSeconds) };

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  // Verrouillage temporaire après 5 échecs sur une même adresse (appliqué à toute adresse,
  // qu'un compte existe ou non : pas d'énumération possible).
  const failuresKey = `login:fail:${parsed.data.email}`;
  const emailLock = peekRateLimit(failuresKey, LOGIN_FAILURES_PER_EMAIL);
  if (!emailLock.ok) return { error: tooManyAttemptsMessage(emailLock.retryAfterSeconds) };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Défense contre les timing attacks & l'énumération de comptes : toujours exécuter verifyPassword
  const isValid = await verifyPassword(parsed.data.password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !isValid) {
    consumeRateLimit(failuresKey, LOGIN_FAILURES_PER_EMAIL);
    return { error: "E-mail ou mot de passe incorrect." };
  }
  clearRateLimit(failuresKey);

  await createSession(user.id);
  await attachCartToUser(user.id);
  redirect(sanitizeNextUrl(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  await clearCookie(CART_COOKIE);
  redirect("/");
}

