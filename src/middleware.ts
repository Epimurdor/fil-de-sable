import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

// Content-Security-Policy à nonce (guide Next.js « Content Security Policy »). Un nonce aléatoire est
// tiré à chaque requête et remplace 'unsafe-inline' dans script-src : Next.js lit ce nonce dans l'en-tête
// Content-Security-Policy de la *requête* et le pose sur tous ses scripts (runtime, chunks, scripts
// d'hydratation inline). Condition nécessaire : toutes les pages sont rendues à la demande (le layout
// racine lit les cookies), une page prérendue n'aurait pas de nonce.
//
// Convention `middleware.ts` (dépréciée dans Next 16, avertissement au build), runtime edge et APIs web
// uniquement (pas de node:crypto). Migration possible vers `proxy.ts` (exporter `proxy`, runtime Node).
//
// L'en-tête posé ici remplace la CSP de repli de next.config.ts (même nom d'en-tête) ; les autres
// en-têtes de sécurité (HSTS, X-Frame-Options, COOP/CORP…) restent dans next.config.ts.

const isDev = process.env.NODE_ENV === "development";

export function middleware(request: NextRequest) {
  // 128 bits aléatoires en base64 (WebCrypto, disponible dans le runtime edge).
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...bytes));
  const csp = buildContentSecurityPolicy({ nonce, dev: isDev });

  // En-têtes de requête : Next.js y lit le nonce (Content-Security-Policy) pendant le rendu ;
  // x-nonce le rend lisible depuis un Server Component via headers() (aucun usage aujourd'hui).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Tout sauf : fichiers de build (_next/static), optimiseur d'images (_next/image), fichiers de
      // /public (favicon, robots.txt, .well-known, photos) et le webhook Stripe (réponse JSON, pas de
      // document HTML). Les Server Actions sont des POST sur la page qui les porte : couvertes.
      source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|\\.well-known|images/|api/webhooks).*)",
      // Les préchargements de next/link reçoivent un flux RSC, pas un document : pas de CSP à poser.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
