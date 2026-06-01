import { CheckCircle2 } from "lucide-react";
import { createWhatsappLink } from "./whatsapp";

type PricingCardProps = {
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
};

export function PricingCard({ name, price, features, recommended }: PricingCardProps) {
  const message = `Bonjour SAHELIA AI, je veux un site web.

Pack souhaité : ${name}
Budget approximatif : ${price}

Mon entreprise :
Secteur :
Objectif du site :`;

  return (
    <article className={`glass relative rounded-3xl p-7 ${recommended ? "border-sahelGold/60 shadow-glow" : ""}`}>
      {recommended ? (
        <span className="absolute right-5 top-5 rounded-full bg-sahelGold px-3 py-1 text-xs font-black uppercase tracking-wide text-sahelBlack">
          Recommandé
        </span>
      ) : null}
      <h3 className="text-2xl font-black text-white">{name}</h3>
      <p className="mt-3 text-3xl font-black text-sahelGold">{price}</p>
      <ul className="mt-7 grid gap-4">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-6 text-white/75">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sahelGreen" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a
        href={createWhatsappLink(message)}
        target="_blank"
        rel="noreferrer"
        className={`mt-8 inline-flex w-full justify-center rounded-full px-5 py-3 font-black transition ${
          recommended ? "bg-sahelGold text-sahelBlack hover:bg-white" : "border border-white/15 text-white hover:border-sahelGold hover:text-sahelGold"
        }`}
      >
        Choisir ce pack
      </a>
    </article>
  );
}
