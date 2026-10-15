// Refus des mots de passe les plus courants (en tête des listes publiques de fuites) et de ceux
// calqués sur l'adresse e-mail. Liste volontairement courte : la vraie défense reste scrypt,
// la limitation de débit et le verrouillage après échecs (src/lib/auth/actions.ts).
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "motdepasse",
  "motdepasse1",
  "motdepasse123",
  "12345678",
  "123456789",
  "1234567890",
  "azertyuiop",
  "azerty123",
  "azerty1234",
  "qwertyuiop",
  "qwerty123",
  "iloveyou",
  "11111111",
  "00000000",
  "abcd1234",
  "admin123",
  "bonjour123",
  "soleil123",
  "fildesable",
  "macrame123",
  "welcome1",
  "letmein1",
  "football",
]);

export function isWeakPassword(password: string, email: string): boolean {
  const lowered = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowered)) return true;
  // Même caractère répété (aaaaaaaa, 00000000…)
  if (/^(.)\1+$/.test(lowered)) return true;
  const normalizedEmail = email.toLowerCase();
  const localPart = normalizedEmail.split("@")[0] ?? "";
  return lowered === normalizedEmail || (localPart.length >= 4 && lowered === localPart);
}

export const WEAK_PASSWORD_MESSAGE = "Ce mot de passe est trop courant ou trop proche de ton e-mail : choisis-en un autre.";
