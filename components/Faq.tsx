"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Combien coûte un site web ?",
    answer:
      "Nos offres commencent à partir de 100 000 FCFA pour un site professionnel simple. Le prix dépend ensuite du nombre de pages, des fonctionnalités et du niveau d’accompagnement souhaité.",
  },
  {
    question: "Combien de temps faut-il pour livrer un site ?",
    answer:
      "Un site simple peut être livré en 72h après réception des contenus. Les projets plus complets prennent généralement entre 7 et 14 jours.",
  },
  {
    question: "Le site fonctionne-t-il sur téléphone ?",
    answer:
      "Oui. Tous nos sites sont conçus en mobile-first pour fonctionner parfaitement sur smartphone, tablette et ordinateur.",
  },
  {
    question: "Est-ce que WhatsApp est intégré ?",
    answer:
      "Oui. Chaque site peut intégrer un bouton WhatsApp direct avec un message prérempli pour faciliter les demandes clients.",
  },
  {
    question: "Fournissez-vous l’hébergement et le nom de domaine ?",
    answer:
      "Oui. Nous pouvons accompagner le client pour le choix du nom de domaine, l’hébergement, la configuration et la mise en ligne.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-sahelGold">
            FAQ
          </p>

          <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">
            Questions fréquentes.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Les réponses aux questions les plus fréquentes avant de lancer votre
            site avec SAHELIA AI.
          </p>
        </div>

        <div className="mt-12 grid gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={faq.question}
                className="glass overflow-hidden rounded-3xl transition-all duration-300 hover:border-sahelGold/30"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-5 p-6 text-left"
                >
                  <h3 className="text-lg font-black text-white md:text-xl">
                    {faq.question}
                  </h3>

                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-sahelGold transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6">
                    <p className="leading-8 text-white/65">{faq.answer}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}