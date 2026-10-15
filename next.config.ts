import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/security/csp";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  // CSP de repli, sans nonce (donc avec 'unsafe-inline' pour les scripts d'hydratation). La CSP réelle,
  // à nonce par requête, est posée par src/middleware.ts et REMPLACE celle-ci quand le middleware
  // s'exécute (Next comme le serveur de next-bundle écrasent l'en-tête de même nom) : une seule CSP part
  // dans tous les cas. Celle-ci ne sert que là où le middleware n'est pas exécuté (par exemple un
  // proxy.ts Node chez Wasmer : next-bundle 1.0.0 n'exécute que les middlewares en runtime « edge »).
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
  // Hébergement Wasmer (next-bundle) : seuls les fichiers tracés sont embarqués. Le client Prisma
  // lit son moteur WebAssembly (query_compiler_bg.wasm) sur le disque : invisible pour le traçage.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*", "./node_modules/@swc/helpers/**/*"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Hébergement Wasmer (next-bundle) : les routes d'erreur "/500" et "/404/?" y sont appliquées sans
  // ancrage, donc à tout chemin qui CONTIENT "/500" ou "/404". Un chunk nommé "500-<hash>.js" était servi
  // en 500 et cassait la navigation. Tous les chunks client sont préfixés : "chunks/c-500-<hash>.js".
  // Modèle de nom fixe (pas de fonction) : le chargeur de webpack doit calculer les mêmes noms que le build.
  // Garde-fou : scripts/check-static-paths.mjs.
  webpack(config, { isServer, dev }) {
    if (isServer || dev) return config;
    const prefix = (template: string) => template.replace("static/chunks/", "static/chunks/c-");
    for (const key of ["filename", "chunkFilename"] as const) {
      const template = config.output?.[key];
      if (typeof template === "string") config.output[key] = prefix(template);
    }
    return config;
  },
};

export default nextConfig;
