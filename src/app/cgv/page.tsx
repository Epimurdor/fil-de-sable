import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { legal, site } from "@/config/site";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function TermsPage() {
  const { seller, mediator } = legal;
  return (
    <LegalPage title="Conditions générales de vente">
      <p>
        Version : {legal.cgvVersion}. Ces conditions s'appliquent à toute commande passée sur le site {site.name} par un
        consommateur (personne physique n'agissant pas à des fins professionnelles).
      </p>

      <h2>1. Vendeur</h2>
      <p>
        {seller.publisher}, {seller.status.toLowerCase()}, {seller.address}, SIRET {seller.siret}, e-mail{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>, téléphone {seller.phone}. Coordonnées complètes dans les{" "}
        <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>2. Produits</h2>
      <p>
        Les bijoux (bracelets, bagues, colliers) sont noués à la main, <strong>après réception de la commande</strong>. Ils
        sont décrits sur chaque fiche produit (matières, dimensions, options). De petites variations de nœuds, de couleur
        de fil ou de pierre naturelle sont inhérentes au travail manuel et aux matériaux naturels, et ne constituent pas un
        défaut. Les couleurs affichées à l'écran peuvent différer légèrement du produit réel.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros. {seller.vat}. Les frais de livraison sont indiqués avant la validation de la
        commande ; la livraison est offerte à partir de 60 € d'achats, selon les modes de livraison proposés. Le prix
        applicable est celui affiché au moment de la validation de la commande.
      </p>

      <h2>4. Commande</h2>
      <p>
        Pour commander, il faut créer un compte, remplir l'adresse de livraison, choisir un mode de livraison puis accepter
        les présentes conditions. Le bouton « Commande avec obligation de paiement » valide la commande : elle ne devient
        ferme qu'après le paiement. Un e-mail de confirmation est envoyé à l'adresse du compte. Le vendeur peut refuser ou
        annuler une commande pour motif légitime (litige antérieur, produit indisponible, erreur manifeste de prix), avec
        remboursement intégral.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement s'effectue en ligne, en euros, par carte bancaire via la plateforme sécurisée Stripe. Le vendeur n'a
        jamais accès aux numéros de carte. La commande est débitée au moment de la validation du paiement.
      </p>

      <h2>6. Délais et livraison</h2>
      <p>
        Chaque pièce est confectionnée dans le délai indiqué sur sa fiche (« délai de confection »), puis expédiée sous{" "}
        {legal.shippingDays}. Le délai de livraison dépend ensuite du mode choisi (lettre suivie, Mondial Relay ou
        Colissimo). Sauf indication contraire, le vendeur livre au plus tard 30 jours après la conclusion du contrat. En cas
        de retard, le consommateur peut, après mise en demeure restée sans effet, résoudre le contrat dans les conditions
        des articles L216-2 et L216-3 du code de la consommation. Les risques de perte ou d'endommagement du colis sont
        supportés par le vendeur jusqu'à la remise du colis au consommateur (art. L216-4).
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Le consommateur dispose de <strong>14 jours</strong> à compter de la réception du bien pour se rétracter sans
        justification (art. L221-18). Il notifie sa décision par une déclaration dénuée d'ambiguïté, en utilisant si
        besoin le <Link href="/retractation">modèle de formulaire</Link>. Les frais de retour sont à sa charge. Le vendeur
        rembourse toutes les sommes versées, frais de livraison standard compris, dans les 14 jours suivant la
        notification, par le même moyen de paiement.
      </p>
      <p>
        <strong>Exception :</strong> conformément à l'article L221-28, 3° du code de la consommation, le droit de
        rétractation ne s'applique pas aux biens confectionnés selon les spécifications du consommateur ou nettement
        personnalisés, notamment les bracelets composés dans le configurateur (choix des fils, de la perle, du motif et de la
        taille). Cette exception est rappelée avant la validation de la commande et doit être reconnue par le consommateur.
      </p>

      <h2>8. Garanties légales</h2>
      <p>
        Le vendeur est tenu de la garantie légale de conformité (art. L217-3 et suivants du code de la consommation) et de
        la garantie des vices cachés (art. 1641 et suivants du code civil), indépendamment de toute garantie commerciale.
      </p>
      <ul>
        <li>
          Garantie légale de conformité : le consommateur bénéficie d'un délai de 2 ans à compter de la délivrance du bien
          pour agir ; il est dispensé de prouver que le défaut existait lors de la délivrance pendant les 24 mois suivant
          celle-ci. Il peut choisir entre la réparation et le remplacement du bien, sous réserve des conditions de coût
          prévues par l'article L217-12 ; à défaut, il peut obtenir une réduction du prix ou la résolution du contrat. Il
          n'a pas à avancer de frais pour la réparation ou le remplacement.
        </li>
        <li>
          Garantie des vices cachés : le consommateur peut choisir entre la résolution de la vente et une réduction du
          prix, dans un délai de 2 ans à compter de la découverte du vice (art. 1648 du code civil).
        </li>
      </ul>
      <p>
        Pour toute demande, écrire à <a href={`mailto:${site.email}`}>{site.email}</a> en indiquant le numéro de commande
        et, si possible, des photographies.
      </p>

      <h2>9. Entretien</h2>
      <p>
        Pour prolonger la vie du bijou : éviter les parfums, produits ménagers et le chlore, sécher après contact avec l'eau
        et ne pas tirer sur le nœud coulissant. Les bijoux ne sont pas destinés aux enfants de moins de 36 mois (petites
        pièces). Les pierres naturelles et le laiton peuvent évoluer dans le temps.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Les données collectées servent à traiter la commande et à gérer le compte. Voir la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>11. Médiation et litiges</h2>
      <p>
        Le consommateur peut d'abord adresser une réclamation écrite au vendeur. À défaut de solution amiable, il a le
        droit de recourir gratuitement au médiateur de la consommation : {mediator.name}, {mediator.address},{" "}
        {mediator.website}. Le contrat est soumis au droit français ; le consommateur peut saisir le tribunal compétent
        selon les règles légales.
      </p>
    </LegalPage>
  );
}
