import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser, sanitizeNextUrl } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/compte" } = await searchParams;
  if (await getCurrentUser()) redirect(sanitizeNextUrl(next));

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-medium tracking-tight text-ink">Content de te revoir</h1>
      <p className="mt-2 text-ink-3">Connecte-toi pour suivre tes commandes et retrouver ton panier.</p>
      <div className="mt-8 rounded-md border border-line bg-card p-6">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-3">
        Pas encore de compte ?{" "}
        <Link href={`/inscription?next=${encodeURIComponent(next)}`} className="font-semibold text-accent-strong hover:underline">
          Crée-le en 30 secondes
        </Link>
      </p>
    </div>
  );
}
