"use client";

import { MessageCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { SectionTitle } from "../../components/SectionTitle";
import { createWhatsappLink } from "../../components/whatsapp";

export default function ContactPage() {
  const [form, setForm] = useState({
    company: "",
    name: "",
    phone: "",
    pack: "Pack Business",
    message: "",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = `Bonjour SAHELIA AI, je veux un site web.

Mon entreprise : ${form.company}
Nom : ${form.name}
Téléphone : ${form.phone}
Pack souhaité : ${form.pack}
Message : ${form.message}

Secteur :
Objectif du site :
Budget approximatif :`;

    window.open(createWhatsappLink(message), "_blank", "noopener,noreferrer");
  }

  return (
    <main className="px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.85fr_1.15fr]">
        <SectionTitle
          align="left"
          eyebrow="Contact"
          title="Parlez-nous de votre projet, nous vous répondons sur WhatsApp."
          description="Le formulaire prépare votre message. Aucun backend n’est utilisé : le bouton ouvre directement WhatsApp avec les informations saisies."
        />

        <form
          onSubmit={handleSubmit}
          className="glass grid gap-5 rounded-3xl p-6 md:p-8"
        >
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/75">
              Nom entreprise
            </span>
            <input
              required
              value={form.company}
              onChange={(event) =>
                setForm({ ...form, company: event.target.value })
              }
              className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-sahelGold"
              placeholder="Ex. Cabinet Horizon"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/75">Nom</span>
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-sahelGold"
                placeholder="Votre nom"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/75">
                Téléphone
              </span>
              <input
                required
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-sahelGold"
                placeholder="+235 ..."
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/75">
              Pack souhaité
            </span>
            <select
              value={form.pack}
              onChange={(event) =>
                setForm({ ...form, pack: event.target.value })
              }
              className="rounded-2xl border border-white/12 bg-sahelBlack px-4 py-4 text-white outline-none transition focus:border-sahelGold"
            >
              <option>Pack Starter</option>
              <option>Pack Business</option>
              <option>Pack Premium</option>
              <option>Maintenance mensuelle</option>
              <option>Je ne sais pas encore</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/75">Message</span>
            <textarea
              required
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              rows={6}
              className="resize-none rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-sahelGold"
              placeholder="Décrivez votre activité, votre objectif et votre délai idéal."
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sahelGold px-7 py-4 font-black text-sahelBlack transition hover:bg-white"
          >
            Envoyer sur WhatsApp
            <MessageCircle className="h-5 w-5" />
          </button>
        </form>
      </div>
    </main>
  );
}