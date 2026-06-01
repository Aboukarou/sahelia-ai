import { CreditCard, Repeat } from "lucide-react";
import { PricingCard } from "../../components/PricingCard";
import { SectionTitle } from "../../components/SectionTitle";
import { createWhatsappLink } from "../../components/whatsapp";

export default function TarifsPage() {
  return (
    <main className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Tarifs"
          title="Des offres claires pour lancer votre présence digitale rapidement."
          description="Choisissez un pack selon votre ambition. Nous pouvons ajuster le périmètre après un court brief WhatsApp."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <PricingCard name="Pack Starter" price="100 000 FCFA" features={["Site 1 page", "Design responsive", "Bouton WhatsApp", "Formulaire contact", "Livraison rapide"]} />
          <PricingCard name="Pack Business" price="250 000 FCFA" recommended features={["Jusqu’à 5 pages", "SEO de base", "Google Maps", "WhatsApp intégré", "Formation client"]} />
          <PricingCard name="Pack Premium" price="500 000 FCFA" features={["Site complet premium", "Automatisation WhatsApp", "Chatbot IA simple", "CRM léger", "Blog ou réservation", "Support prioritaire"]} />
        </div>
        <div className="glass mt-10 grid gap-6 rounded-3xl p-7 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sahelGold text-sahelBlack">
            <Repeat className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Maintenance mensuelle à partir de 25 000 FCFA/mois.</h2>
            <p className="mt-2 leading-7 text-white/65">Idéal pour garder votre site à jour, corriger rapidement les détails et ajouter de petites évolutions.</p>
          </div>
          <a href={createWhatsappLink("Bonjour SAHELIA AI, je veux une maintenance mensuelle pour mon site web.")} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 font-black text-white transition hover:border-sahelGold hover:text-sahelGold">
            Demander <CreditCard className="h-5 w-5" />
          </a>
        </div>
      </div>
    </main>
  );
}
