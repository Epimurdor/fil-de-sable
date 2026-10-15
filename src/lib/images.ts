// Seules les photos servies depuis /public/images sont autorisées : next/image refuse (erreur 500)
// tout domaine absent de images.remotePatterns, et une URL externe ouvrirait la porte au pistage.
const LOCAL_IMAGE = /^\/images\/[\w\-/]+\.(?:jpe?g|png|webp|avif)$/i;

export function isLocalImagePath(path: string | null | undefined): path is string {
  return typeof path === "string" && LOCAL_IMAGE.test(path) && !path.includes("//");
}
