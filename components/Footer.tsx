import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { createWhatsappLink } from "./whatsapp";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_.8fr_.8fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/sahelia-logo.png"
              alt="SAHELIA AI"
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl object-contain"
            />

            <div>
              <p className="text-lg font-black text-white">
                SAHELIA AI
              </p>

              <p className="text-sm text-sahelGold">
                Web • WhatsApp • IA
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-md leading-7 text-white/65">
            Nous aidons les entreprises africaines à transformer leur présence
            digitale en véritable levier de visibilité, de confiance et de
            croissance.
          </p>
        </div>

        <div>
          <h3 className="font-black text-white">
            Navigation
          </h3>

          <div className="mt-4 grid gap-3 text-sm">
            <Link
              href="/services"
              className="text-white/65 transition hover:text-sahelGold"
            >
              Services
            </Link>

            <Link
              href="/portfolio"
              className="text-white/65 transition hover:text-sahelGold"
            >
              Portfolio
            </Link>

            <Link
              href="/tarifs"
              className="text-white/65 transition hover:text-sahelGold"
            >
              Tarifs
            </Link>

            <Link
              href="/contact"
              className="text-white/65 transition hover:text-sahelGold"
            >
              Contact
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-black text-white">
            Contact
          </h3>

          <div className="mt-4 grid gap-4 text-sm text-white/65">
            <a
              href={createWhatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition hover:text-sahelGold"
            >
              <MessageCircle className="h-4 w-4 text-sahelGold" />
              +235 93 97 32 20
            </a>

            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-sahelGold" />
              contact@sahelia.ai
            </span>

            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sahelGold" />
              N'Djaména • Tchad
            </span>

            <a
              href={createWhatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-sahelGold px-5 py-3 font-black text-sahelBlack transition hover:bg-white"
            >
              Demander un devis gratuit
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-white/50">
        © 2026 SAHELIA AI — Tous droits réservés.
      </div>
    </footer>
  );
}