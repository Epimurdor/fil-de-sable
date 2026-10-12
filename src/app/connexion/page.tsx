import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/compte" } = await searchParams;
  if (await getCurrentUser()) redirect(next.startsWith("/") ? next : "/compte");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-bark-900">Content de te revoir</h1>
      <p className="mt-2 text-bark-500">Connecte-toi pour suivre tes commandes et retrouver ton panier.</p>
      <div className="mt-8 rounded-3xl border border-sand-200 bg-white p-6 shadow-soft">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-bark-500">
        Pas encore de compte ?{" "}
        <Link href={`/inscription?next=${encodeURIComponent(next)}`} className="font-semibold text-terracotta-600 hover:underline">
          Crée-le en 30 secondes
        </Link>
      </p>
    </div>
  );
}
