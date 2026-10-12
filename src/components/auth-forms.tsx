"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { login, register, type AuthState } from "@/lib/auth/actions";

function ErrorLine({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
      {error}
    </p>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>
      <ErrorLine error={state.error} />
      <SubmitButton pendingText="Connexion…" className="w-full">Se connecter</SubmitButton>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(register, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" className="field" autoComplete="given-name" required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" className="field" autoComplete="family-name" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Mot de passe <span className="font-normal text-ink-3">(8 caractères minimum)</span></label>
        <input id="password" name="password" type="password" className="field" autoComplete="new-password" minLength={8} required />
      </div>
      <ErrorLine error={state.error} />
      <SubmitButton pendingText="Création du compte…" className="w-full">Créer mon compte</SubmitButton>
    </form>
  );
}
