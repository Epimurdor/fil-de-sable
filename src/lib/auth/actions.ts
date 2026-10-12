"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession } from "./session";
import { attachCartToUser } from "@/lib/cart/cart";

export type AuthState = { error?: string };

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Adresse e-mail invalide."));

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Ton prénom nous manque."),
  lastName: z.string().trim().min(1, "Ton nom nous manque."),
  email: emailField,
  password: z.string().min(8, "8 caractères minimum pour le mot de passe."),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Mot de passe manquant."),
});

// Redirection post-connexion limitée au site (pas d'URL externe).
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/compte";
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { email, password, firstName, lastName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "Un compte existe déjà avec cette adresse." };

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password), firstName, lastName },
  });
  await createSession(user.id);
  await attachCartToUser(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  await createSession(user.id);
  await attachCartToUser(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
