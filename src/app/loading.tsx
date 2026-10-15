import { Thread } from "@/components/thread";
import styles from "./loading.module.css";

// Affiché dès le clic sur un lien, le temps que le serveur prépare la page : sans lui, un rendu lent
// (plusieurs secondes sur l'hébergement actuel) donne l'impression qu'un bouton ne fait rien.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-4">
      <Thread className={`${styles.thread} h-8 w-64 text-accent`} />
      <p className="mt-4 font-hand text-2xl text-ink-2">On noue la page…</p>
    </div>
  );
}
