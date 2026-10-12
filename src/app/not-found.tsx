import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="font-display text-7xl font-semibold text-terracotta-500/60">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-bark-900">Ce fil ne mène nulle part</h1>
      <p className="mt-3 text-bark-500">La page a bougé, ou n'a jamais existé. La boutique, elle, est bien là.</p>
      <div className="mt-8">
        <ButtonLink href="/boutique">Retour à la boutique</ButtonLink>
      </div>
    </div>
  );
}
