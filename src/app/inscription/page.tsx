import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser, sanitizeNextUrl } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/compte" } = await searchParams;
  if (await getCurrentUser()) redirect(sanitizeNextUrl(next));

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-medium tracking-tight text-ink">Bienvenue à l'atelier</h1>
      <p className="mt-2 text-ink-3">Un compte pour suivre la confection de tes pièces, étape par étape.</p>
      <div className="mt-8 rounded-md border border-line bg-white p-6">
        <RegisterForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-3">
        Déjà un compte ?{" "}
        <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="font-semibold text-accent-strong hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
