import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <h1 className="text-3xl font-medium tracking-tight text-ink">Cette page n'existe pas.</h1>
      <p className="mt-3 text-ink-2">Elle a bougé, ou n'a jamais existé. La boutique, elle, est bien là.</p>
      <div className="mt-8">
        <ButtonLink href="/boutique">Voir la boutique</ButtonLink>
      </div>
    </div>
  );
}
