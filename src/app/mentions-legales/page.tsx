import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { legal, site } from "@/config/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  const { seller, host } = legal;
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        Le site {site.name} est édité par {seller.publisher}, {seller.status.toLowerCase()}.
      </p>
      <ul>
        <li>Adresse : {seller.address}</li>
        <li>E-mail : <a href={`mailto:${site.email}`}>{site.email}</a></li>
        <li>Téléphone : {seller.phone}</li>
        <li>SIRET : {seller.siret}</li>
        <li>Répertoire des métiers : {seller.rm}</li>
        <li>{seller.vat}</li>
      </ul>
      <p>Directrice ou directeur de la publication : {seller.publisher}.</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par {host.name}, {host.address}. {host.note}
      </p>

      <h2>Médiation de la consommation</h2>
      <p>
        En cas de litige, après une réclamation écrite restée sans réponse satisfaisante, le consommateur peut recourir
        gratuitement au médiateur de la consommation : {legal.mediator.name}, {legal.mediator.address},{" "}
        {legal.mediator.website}.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies, visuels et créations présentés sur ce site sont la propriété de l'éditeur, sauf mention
        contraire. Toute reproduction ou réutilisation sans autorisation écrite est interdite.
      </p>

      <h2>Données personnelles et cookies</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link>. Le site n'utilise que des cookies strictement
        nécessaires à son fonctionnement (connexion et panier) : aucun cookie de mesure d'audience ni de publicité.
      </p>
    </LegalPage>
  );
}
