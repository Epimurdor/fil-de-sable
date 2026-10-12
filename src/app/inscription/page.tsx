import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/compte" } = await searchParams;
  if (await getCurrentUser()) redirect(next.startsWith("/") ? next : "/compte");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-bark-900">Bienvenue à l'atelier</h1>
      <p className="mt-2 text-bark-500">Un compte pour suivre la confection de tes pièces, étape par étape.</p>
      <div className="mt-8 rounded-3xl border border-sand-200 bg-white p-6 shadow-soft">
        <RegisterForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-bark-500">
        Déjà un compte ?{" "}
        <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="font-semibold text-terracotta-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
