import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// 'unsafe-inline' reste nécessaire aux scripts d'hydratation de Next sans nonce ;
// 'unsafe-eval' uniquement en dev (React s'en sert pour reconstruire les piles d'appels).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Photos servies depuis /public uniquement (voir src/lib/images.ts).
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  // Stripe Checkout : redirection après envoi du formulaire de paiement.
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // HSTS seulement en production : en local, il « collerait » le HTTPS à localhost.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
  // en 500 et cassait la navigation. Les chunks au nom numérique deviennent "chunks/c-500-<hash>.js" ;
  // main, webpack, framework… gardent leur nom. Garde-fou : scripts/check-static-paths.mjs.
  webpack(config, { isServer, dev }) {
    if (isServer || dev) return config;
    const prefix = (template: string) => template.replace("static/chunks/", "static/chunks/c-");
    const { filename, chunkFilename } = config.output ?? {};
    if (typeof chunkFilename === "string") config.output.chunkFilename = prefix(chunkFilename);
    if (typeof filename === "string") {
      config.output.filename = (pathData: { chunk?: { name?: string | null; id?: string | number | null } }) => {
        const name = String(pathData.chunk?.name ?? pathData.chunk?.id ?? "");
        return /^\d/.test(name) ? prefix(filename) : filename;
      };
    }
    return config;
  },
};

export default nextConfig;
