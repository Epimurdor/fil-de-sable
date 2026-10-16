// Directives de la Content-Security-Policy du site, en un seul endroit pour deux usages :
// - src/middleware.ts : CSP à nonce (script-src sans 'unsafe-inline'), envoyée quand le middleware s'exécute ;
// - next.config.ts : CSP de repli sans nonce, là où le middleware n'est pas exécuté (voir next.config.ts).
// Pas de `server-only` ici : next.config.ts est chargé hors de l'application, et le middleware tourne
// dans le runtime edge (APIs web uniquement).

export function buildContentSecurityPolicy({ nonce, dev }: { nonce?: string; dev: boolean }): string {
  const scriptSrc = nonce
    ? // 'strict-dynamic' : les scripts porteurs du nonce (runtime, chunks, hydratation) peuvent en charger
      // d'autres (chunks à la demande, navigation client) ; 'self' n'est lu que par les navigateurs sans CSP 3.
      `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : // Sans nonce, les scripts d'hydratation inline de Next exigent 'unsafe-inline'.
      "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    // 'wasm-unsafe-eval' : compilation WebAssembly seulement (décodeur meshopt des modèles 3D GLB),
    // sans autoriser eval(). 'unsafe-eval' uniquement en développement : React s'en sert pour
    // reconstruire les piles d'appels.
    `script-src ${scriptSrc} 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    // React n'émet jamais d'attribut onclick= / onerror= : un gestionnaire injecté dans un attribut
    // (<img onerror=…>) est bloqué, même quand script-src tolère 'unsafe-inline'.
    "script-src-attr 'none'",
    // Les styles inline (attribut style= posé par React) ne peuvent pas porter de nonce.
    "style-src 'self' 'unsafe-inline'",
    // Photos servies depuis /public uniquement (voir src/lib/images.ts).
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    // Stripe Checkout : redirection après envoi du formulaire de paiement.
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
