import { Bot, Building2, Globe2, HandHeart, HeartPulse, Megaphone, MessageCircle, RefreshCcw, School, Search, Store, Utensils } from "lucide-react";
import { SectionTitle } from "../../components/SectionTitle";
import { ServiceCard } from "../../components/ServiceCard";

const services = [
  { icon: Globe2, title: "Création de site vitrine", description: "Présentez votre entreprise avec une image premium, crédible et adaptée aux usages mobiles." },
  { icon: Megaphone, title: "Landing page de vente", description: "Une page ciblée pour promouvoir une offre, collecter des demandes et accélérer vos ventes." },
  { icon: School, title: "Site pour école", description: "Programmes, inscriptions, actualités et contact parents dans une expérience claire et rassurante." },
  { icon: HeartPulse, title: "Site pour clinique", description: "Services médicaux, horaires, spécialités et prise de contact rapide via WhatsApp." },
  { icon: Utensils, title: "Site pour restaurant", description: "Menu, photos, localisation, réservations et commandes avec une présentation appétissante." },
  { icon: HandHeart, title: "Site pour ONG", description: "Missions, projets, preuves d’impact et appels aux partenaires dans un format professionnel." },
  { icon: RefreshCcw, title: "Refonte de site", description: "Modernisez un site vieillissant pour améliorer confiance, vitesse, lisibilité et conversion." },
  { icon: Search, title: "SEO Google de base", description: "Titres, descriptions, structure et contenus optimisés pour mieux ressortir dans les recherches." },
  { icon: MessageCircle, title: "Automatisation WhatsApp", description: "Messages préremplis, parcours de qualification et réponses simples pour gagner du temps." },
  { icon: Building2, title: "Maintenance web", description: "Mises à jour, corrections, petites évolutions et suivi mensuel pour garder votre site solide." },
  { icon: Bot, title: "Chatbot IA simple", description: "Un assistant de premier niveau pour répondre aux questions fréquentes et orienter les prospects." },
  { icon: Store, title: "Présence locale", description: "Google Maps, informations essentielles et CTA pensés pour attirer les clients proches de vous." }
];

export default function ServicesPage() {
  return (
    <main className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Services"
          title="Des solutions digitales concrètes pour les entreprises africaines."
          description="SAHELIA AI crée des sites rapides, élégants et connectés aux outils que vos clients utilisent déjà."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => <ServiceCard key={service.title} {...service} />)}
        </div>
      </div>
    </main>
  );
}
