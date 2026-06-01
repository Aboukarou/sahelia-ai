import { ProjectCard } from "../../components/ProjectCard";
import { SectionTitle } from "../../components/SectionTitle";

const projects = [
  {
    title: "SAHELIA AI — Agence Web & IA",
    sector: "Agence web & intelligence artificielle",
    description:
      "Site vitrine premium conçu pour présenter une offre claire, crédible et orientée conversion autour du web, de l’IA et de WhatsApp.",
    badge: "AGENCE IA",
    image: "/projects/sahelia.jpg",
    ctaLabel: "Obtenir un devis similaire",
    href: "/contact",
  },
  {
    title: "iTech Services — Maintenance informatique",
    sector: "Services IT",
    description:
      "Présence digitale professionnelle pensée pour rassurer les clients et générer plus de demandes.",
    badge: "SERVICES IT",
    image: "/projects/itech.jpg",
    ctaLabel: "Obtenir un devis similaire",
    href: "/contact",
  },
  {
    title: "Watiri — Marketplace automobile",
    sector: "Automobile",
    description:
      "Marketplace automobile mobile-first adaptée au marché tchadien.",
    badge: "AUTOMOBILE",
    image: "/projects/watiri.jpg",
    ctaLabel: "Obtenir un devis similaire",
    href: "/contact",
  },
];

export default function PortfolioPage() {
  return (
    <main className="px-4 py-16 md:px-8">
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
    </main>
  );
}