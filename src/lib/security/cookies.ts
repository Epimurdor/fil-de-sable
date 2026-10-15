import "server-only";
import { cookies } from "next/headers";

// Noms et attributs communs des cookies de l'application.
//
// En production (HTTPS), le préfixe __Host- impose au navigateur : Secure, Path=/ et aucun attribut
// Domain. Un cookie du même nom posé par un autre sous-domaine de l'hébergeur (*.wasmer.app) ou
// injecté en clair est alors refusé : ni fixation de session, ni panier imposé depuis l'extérieur.
// En développement (http://localhost), le préfixe est omis : il exige une origine sécurisée.
const isProduction = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = isProduction ? "__Host-fds_session" : "fds_session";
export const CART_COOKIE = isProduction ? "__Host-fds_cart" : "fds_cart";

export const cookieBaseOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
} as const;

// Suppression explicite avec les mêmes attributs : un cookie __Host- n'est effacé que si le
// Set-Cookie d'expiration porte lui aussi Secure et Path=/.
export async function clearCookie(name: string): Promise<void> {
  (await cookies()).set(name, "", { ...cookieBaseOptions, maxAge: 0, expires: new Date(0) });
}
