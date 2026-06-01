import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ProjectCardProps = {
  title: string;
  sector: string;
  description: string;
  badge: string;
  image?: string;
  href?: string;
  ctaLabel?: string;
};

export function ProjectCard({
  title,
  sector,
  description,
  badge,
  image,
  href = "/contact",
  ctaLabel = "Obtenir un devis similaire",
}: ProjectCardProps) {
  return (
    <article className="glass overflow-hidden rounded-3xl border border-white/10 transition-all duration-300 hover:-translate-y-2 hover:border-sahelGold/40 hover:shadow-[0_20px_60px_rgba(255,183,0,0.12)]">
      {image && (
        <div className="relative h-72 w-full overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 to-slate-900">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-4 transition duration-500 hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </div>
      )}

      <div className="p-6">
        <span className="rounded-full bg-sahelGreen/25 px-4 py-2 text-xs font-black uppercase tracking-wider text-sahelGold">
          {badge}
        </span>

        <h3 className="mt-6 text-2xl font-black leading-tight text-white">
          {title}
        </h3>

        <p className="mt-3 text-sm font-bold text-sahelGold">{sector}</p>

        <p className="mt-5 leading-8 text-white/70">{description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
            Responsive
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
            WhatsApp
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
            SEO
          </span>
        </div>

        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-bold text-white transition-all hover:border-sahelGold hover:bg-sahelGold hover:text-sahelBlack"
        >
          {ctaLabel}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}