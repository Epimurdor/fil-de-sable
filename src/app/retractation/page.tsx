import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { legal, site } from "@/config/site";

export const metadata: Metadata = { title: "Droit de rétractation" };

export default function WithdrawalPage() {
  return (
    <LegalPage title="Droit de rétractation">
      <p>
        Tu disposes de <strong>14 jours</strong> à compter de la réception de ta commande pour te rétracter, sans avoir à
        te justifier. Les conditions et les exceptions (notamment les pièces réalisées sur mesure) sont détaillées à
        l'article 7 des <Link href="/cgv">conditions générales de vente</Link>.
      </p>
      <p>
        Pour te rétracter, informe-nous de ta décision par une déclaration dénuée d'ambiguïté (courrier postal ou e-mail),
        en utilisant si tu le souhaites le modèle ci-dessous. Tu peux aussi l'envoyer à l'adresse{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>

      <h2>Modèle de formulaire de rétractation</h2>
      <p className="text-sm">(À compléter et à renvoyer uniquement si tu souhaites te rétracter.)</p>
      <div className="rounded-md border border-line bg-card/70 p-6 text-sm leading-relaxed">
        <p>À l'attention de {legal.seller.publisher}, {legal.seller.address}, {site.email} :</p>
        <p className="mt-3">
          Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous :
        </p>
        <ul className="mt-3 !list-none !pl-0">
          <li>Commande n° : ……………………………………… (ex. FDS-2026-XXXXXX)</li>
          <li>Commandée le : ……………………………………… / reçue le : ………………………………………</li>
          <li>Article(s) concerné(s) : ………………………………………………………………………</li>
          <li>Nom du consommateur : ………………………………………………………………………</li>
          <li>Adresse du consommateur : ………………………………………………………………………</li>
          <li>Date : ……………………………………… Signature (uniquement en cas de notification papier) :</li>
        </ul>
      </div>

      <h2>Et ensuite</h2>
      <ul>
        <li>Renvoie les articles sans retard excessif, au plus tard dans les 14 jours suivant ta notification. Les frais de retour sont à ta charge.</li>
        <li>Nous te remboursons la totalité des sommes versées (y compris les frais de livraison standard) au plus tard 14 jours après avoir reçu ta notification, par le moyen de paiement utilisé pour la commande. Nous pouvons différer le remboursement jusqu'à la récupération des articles ou la preuve de leur expédition.</li>
        <li>Les articles doivent être renvoyés dans un état permettant leur revente. Ta responsabilité est engagée en cas de dépréciation résultant de manipulations autres que celles nécessaires pour en vérifier la nature, les caractéristiques et le bon fonctionnement.</li>
      </ul>
    </LegalPage>
  );
}
