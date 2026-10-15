import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/security/csp";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  // CSP de repli, sans nonce (donc avec 'unsafe-inline' pour les scripts d'hydratation). La CSP réelle,
  // à nonce par requête, est posée par src/middleware.ts et REMPLACE celle-ci quand le middleware
  // s'exécute (Next écrase l'en-tête de même nom) : une seule CSP part dans tous les cas. Celle-ci ne
  // sert que pour les chemins exclus du middleware (voir son matcher).
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy({ dev: isDev }) },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // HSTS seulement en production : en local, il « collerait » le HTTPS à localhost.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Seules les photos de /public/images passent par l'optimiseur (/_next/image) : aucune URL
    // externe, aucun autre fichier de /public, pas de paramètre de requête, pas de SVG.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    dangerouslyAllowSVG: false,
  },
  experimental: {
    // Les formulaires du site pèsent quelques Ko : inutile d'accepter 1 Mo (défaut) par Server Action.
    serverActions: { bodySizeLimit: "200kb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
