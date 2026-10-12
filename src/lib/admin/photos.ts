import { readdir } from "node:fs/promises";
import path from "node:path";

export const PHOTOS_DIR = "/images/produits";

// Liste les photos déposées dans public/images/produits, pour les proposer dans le formulaire
// produit sans avoir à taper un chemin.
export async function listProductPhotos(): Promise<string[]> {
  try {
    const entries = await readdir(path.join(process.cwd(), "public", PHOTOS_DIR));
    return entries
      .filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((f) => `${PHOTOS_DIR}/${f}`);
  } catch {
    return [];
  }
}
