import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { legal, site } from "@/config/site";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  const { seller } = legal;
  return (
    <LegalPage title="Politique de confidentialité">
      <p>
        Cette page explique quelles données personnelles {site.name} collecte, pourquoi, combien de temps elles sont
        conservées et comment exercer tes droits (règlement général sur la protection des données, RGPD, et loi
        Informatique et Libertés).
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        {seller.publisher}, {seller.status.toLowerCase()}, {seller.address}, SIRET {seller.siret}. Contact pour toute question
        sur tes données : <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
      </p>

      <h2>Données collectées, finalités et durées</h2>
      <table>
        <thead>
          <tr><th>Données</th><th>Finalité</th><th>Base légale</th><th>Durée de conservation</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Nom, prénom, e-mail, mot de passe (stocké haché)</td>
            <td>Création et gestion du compte</td>
            <td>Exécution du contrat</td>
            <td>Durée du compte, puis suppression après 3 ans sans activité [À VALIDER]</td>
          </tr>
          <tr>
            <td>Nom, adresse, code postal, ville, téléphone (facultatif), note de commande, contenu de la commande</td>
            <td>Préparation, livraison et suivi de la commande, service après-vente</td>
            <td>Exécution du contrat</td>
            <td>Le temps de la commande, puis archivage 10 ans (obligations comptables et conservation des contrats)</td>
          </tr>
          <tr>
            <td>Montants, références de paiement (aucun numéro de carte)</td>
            <td>Comptabilité, preuve des transactions</td>
            <td>Obligation légale</td>
            <td>10 ans</td>
          </tr>
          <tr>
            <td>Cookie de connexion et de panier</td>
            <td>Fonctionnement du site (rester connecté, garder le panier)</td>
            <td>Strictement nécessaire (exempté de consentement)</td>
            <td>Connexion : 30 jours maximum. Panier invité : durée limitée [À COMPLÉTER : valeur exacte]</td>
          </tr>
          <tr>
            <td>Adresse IP (conservée en mémoire du serveur, journaux de l'hébergeur)</td>
            <td>Sécurité du site, limitation des tentatives de connexion</td>
            <td>Intérêt légitime</td>
            <td>Quelques minutes en mémoire ; journaux de l'hébergeur selon sa politique</td>
          </tr>
        </tbody>
      </table>
      <p>
        Ne saisis pas de données sensibles (santé, opinions, etc.) dans le champ « Un mot pour l'atelier » : il sert
        uniquement à préciser une taille ou un cadeau.
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <ul>
        <li>Stripe Payments Europe (paiement en ligne). Stripe est aussi responsable de traitement pour la lutte contre la fraude : <a href="https://stripe.com/fr/privacy" rel="noreferrer" target="_blank">sa politique de confidentialité</a>.</li>
        <li>Render (hébergement du site) et Supabase (base de données, région Union européenne).</li>
        <li>Transporteurs choisis lors de la commande (La Poste / Colissimo, Mondial Relay) : nom, adresse, téléphone.</li>
        <li>[À COMPLÉTER : prestataire d'envoi des e-mails de commande, une fois choisi].</li>
      </ul>
      <p>
        Tes données ne sont ni vendues ni utilisées pour de la publicité. Certains de ces prestataires sont des sociétés
        américaines ou ont des filiales hors de l'Union européenne : les transferts éventuels sont encadrés par les clauses
        contractuelles types de la Commission européenne ou le Data Privacy Framework.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site dépose uniquement deux cookies techniques (connexion et panier). Ils sont nécessaires au service et ne
        demandent donc pas ton consentement. Il n'y a ni mesure d'audience, ni publicité, ni réseau social intégré. La page de
        paiement Stripe, hébergée par Stripe, peut déposer ses propres cookies. Le lien vers Facebook est un simple lien : rien
        n'est chargé tant que tu ne cliques pas.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux demander l'accès à tes données, leur rectification, leur effacement, la limitation du traitement, leur
        portabilité, et t'opposer à un traitement fondé sur l'intérêt légitime. Écris à{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a> : nous répondons dans un délai d'un mois (une pièce
        d'identité peut être demandée en cas de doute). Lors d'une demande d'effacement, les données de commande que la loi
        oblige à conserver (10 ans) sont archivées avec un accès restreint, puis supprimées.
      </p>
      <p>
        Si tu estimes que tes droits ne sont pas respectés, tu peux introduire une réclamation auprès de la CNIL :{" "}
        <a href="https://www.cnil.fr/fr/plaintes" rel="noreferrer" target="_blank">cnil.fr/fr/plaintes</a>.
      </p>

      <h2>Sécurité</h2>
      <p>
        Connexions chiffrées (HTTPS), mots de passe hachés, accès restreint aux données. En cas de violation de données
        présentant un risque pour toi, la CNIL et les personnes concernées sont informées dans les délais légaux.
      </p>

      <h2>Modifications</h2>
      <p>Cette politique peut évoluer ; la date de mise à jour figure en haut de la page. Voir aussi les <Link href="/mentions-legales">mentions légales</Link>.</p>
    </LegalPage>
  );
}
