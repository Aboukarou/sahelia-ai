import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Globe2,
  Layers3,
  MessageCircle,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { PricingCard } from "../components/PricingCard";
import { ProjectCard } from "../components/ProjectCard";
import { SectionTitle } from "../components/SectionTitle";
import { ServiceCard } from "../components/ServiceCard";
import { createWhatsappLink } from "../components/whatsapp";
import { Testimonials } from "../components/Testimonials";
import { Faq } from "../components/Faq";

const quickServices = [
  {
    icon: Globe2,
    title: "Sites web professionnels",
    description:
      "Des vitrines modernes, rapides et rassurantes pour convertir vos visiteurs en prospects qualifiés.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp connecté",
    description:
      "Des boutons, formulaires et parcours pensés pour générer des conversations commerciales.",
  },
  {
    icon: Bot,
    title: "Solutions IA utiles",
    description:
      "Automatisations simples, chatbot de premier niveau et outils pour gagner du temps au quotidien.",
  },
];

const projects = [
  {
    title: "SAHELIA AI — Agence Web & IA",
    sector: "Agence digitale",
    description:
      "Identité premium, pages de conversion et parcours WhatsApp pour lancer une offre web & IA crédible.",
    badge: "AGENCE IA",
    image: "/projects/sahelia.jpg",
    ctaLabel: "Obtenir un devis similaire",
    href: "/contact",
  },
  {
    title: "iTech Services — Maintenance informatique",
    sector: "Services IT",
    description:
      "Site vitrine clair pour présenter les interventions, rassurer les entreprises et recevoir des demandes.",
    badge: "SERVICES IT",
    image: "/projects/itech.jpg",
    ctaLabel: "Obtenir un devis similaire",
    href: "/contact",
  },
  {
    title: "Watiri — Marketplace automobile",
    sector: "Automobile",
    description:
      "Expérience marketplace mobile-first pour acheter, vendre et louer des véhicules avec contact direct.",
    badge: "AUTOMOBILE",
    image: "/projects/watiri.jpg",
    ctaLabel: "Obtenir un devis similaire",
    href: "/contact",
  },
];

const trustItems = [
  "+20 projets livrés",
  "Réponse WhatsApp < 24h",
  "100% responsive",
];

const processSteps = [
  {
    step: "01",
    title: "Brief WhatsApp",
    body: "Nous cadrons votre activité, votre cible et votre objectif commercial.",
  },
  {
    step: "02",
    title: "Maquette rapide",
    body: "Vous validez la direction visuelle, les pages et les messages clés.",
  },
  {
    step: "03",
    title: "Développement",
    body: "Nous construisons un site rapide, responsive et optimisé pour la conversion.",
  },
  {
    step: "04",
    title: "Mise en ligne",
    body: "Nous livrons, formons votre équipe et connectons vos demandes WhatsApp.",
  },
];

const whyUs = [
  {
    icon: ShieldCheck,
    title: "Fiable",
    description:
      "Une image professionnelle qui rassure clients, partenaires et prospects.",
  },
  {
    icon: Zap,
    title: "Rapide",
    description:
      "Des sites légers, mobiles et faciles à consulter même avec une connexion limitée.",
  },
  {
    icon: Search,
    title: "Visible",
    description:
      "Des bases SEO propres pour apparaître sur Google et être compris par vos clients.",
  },
  {
    icon: Target,
    title: "Orienté vente",
    description:
      "Chaque section guide le visiteur vers une demande de devis ou un message WhatsApp.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sahelGold/60 to-transparent" />

        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-4 py-16 md:px-8 lg:grid-cols-[1fr_.82fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75">
              <Sparkles className="h-4 w-4 text-sahelGold" />
              Sites web, WhatsApp et IA pour entreprises africaines
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl lg:text-7xl">
              Transformez vos visiteurs en clients grâce à un site web
              professionnel.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              SAHELIA AI aide les entreprises africaines à construire une
              présence digitale moderne, rapide, crédible et connectée à
              WhatsApp.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={createWhatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sahelGold px-7 py-4 font-black text-sahelBlack transition hover:bg-white"
              >
                Demander un devis gratuit
                <ArrowRight className="h-5 w-5" />
              </a>

              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 font-black text-white transition hover:border-sahelGold hover:text-sahelGold"
              >
                Voir nos offres
              </Link>
            </div>

            <p className="mt-4 text-sm font-semibold text-sahelGold">
              WhatsApp : +235 93 97 32 20
            </p>

            <div className="mt-10 grid gap-4 text-sm text-white/65 sm:grid-cols-3">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-sahelGreen" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass mx-auto max-w-md rounded-[2rem] p-6 shadow-glow">
              <Image
                src="/sahelia-logo.png"
                alt="Logo officiel SAHELIA AI"
                width={720}
                height={720}
                className="h-auto w-full rounded-3xl object-contain"
                priority
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="text-2xl font-black text-sahelGold">+IA</p>
                  <p className="mt-1 text-sm text-white/60">
                    Automatisation utile
                  </p>
                </div>

                <div className="rounded-2xl bg-white/8 p-4">
                  <p className="text-2xl font-black text-sahelGold">24h</p>
                  <p className="mt-1 text-sm text-white/60">
                    Contact WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Services rapides"
            title="Tout ce qu’il faut pour être visible, crédible et contacté."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {quickServices.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* OFFRES */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Offres principales"
            title="Des packs simples, lisibles et prêts à vendre."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <PricingCard
              name="Pack Starter"
              price="100 000 FCFA"
              features={[
                "Site 1 page",
                "Design responsive",
                "Bouton WhatsApp",
                "Formulaire contact",
                "Livraison rapide",
              ]}
            />

            <PricingCard
              name="Pack Business"
              price="250 000 FCFA"
              recommended
              features={[
                "Jusqu’à 5 pages",
                "SEO de base",
                "Google Maps",
                "WhatsApp intégré",
                "Formation client",
              ]}
            />

            <PricingCard
              name="Pack Premium"
              price="500 000 FCFA"
              features={[
                "Site complet premium",
                "Automatisation WhatsApp",
                "Chatbot IA simple",
                "CRM léger",
                "Blog ou réservation",
                "Support prioritaire",
              ]}
            />
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Portfolio"
            title="Des projets conçus pour transformer des visiteurs en clients."
            description="Chaque réalisation est pensée pour rassurer, convaincre et générer des prises de contact via WhatsApp."
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.title} {...project} />
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Process"
            title="Un lancement clair en 4 étapes."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {processSteps.map((item) => (
              <article
                key={item.step}
                className="glass rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-sahelGold/30"
              >
                <p className="text-5xl font-black leading-none text-sahelGold/25">
                  {item.step}
                </p>

                <h3 className="mt-4 text-xl font-black text-white">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-white/62">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI NOUS CHOISIR */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <SectionTitle
            align="left"
            eyebrow="Pourquoi nous choisir"
            title="Une agence pensée pour les réalités des entreprises africaines."
            description="Nous privilégions les pages rapides, les textes qui vendent, les preuves de confiance et les parcours directs vers WhatsApp."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {whyUs.map((item) => (
              <ServiceCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <Faq />

      {/* CTA FINAL */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-sahelGold/35 bg-sahelGreen/20 p-8 text-center shadow-glow md:p-12">
          <Layers3 className="mx-auto h-10 w-10 text-sahelGold" />

          <h2 className="mt-5 text-3xl font-black md:text-5xl">
            Votre entreprise mérite mieux qu'une simple page Facebook.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/70">
            Un site professionnel inspire confiance, valorise votre image et
            génère des demandes de clients 24h/24.
          </p>

          <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-sm font-semibold text-white/70 sm:grid-cols-4">
            {[
              "Site professionnel",
              "WhatsApp intégré",
              "Responsive mobile",
              "Optimisé Google",
            ].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sahelGold" />
                {item}
              </div>
            ))}
          </div>

          <a
            href={createWhatsappLink()}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-sahelGold px-7 py-4 font-black text-sahelBlack transition hover:bg-white"
          >
            Demander mon devis gratuit
            <Rocket className="h-5 w-5" />
          </a>
        </div>
      </section>
    </main>
  );
}