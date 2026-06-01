"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { createWhatsappLink } from "./whatsapp";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-sahelBlack/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3">
          <Image
            src="/sahelia-logo.png"
            alt="SAHELIA AI"
            width={56}
            height={56}
            className="h-12 w-12 rounded-xl object-contain"
            priority
          />

          <div className="leading-tight">
            <span className="block text-lg font-black tracking-wide text-white">
              SAHELIA AI
            </span>
            <span className="hidden text-xs font-semibold text-sahelGold sm:block">
              Web • WhatsApp • IA
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-white/72 transition hover:text-sahelGold"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <a
          href={createWhatsappLink()}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 rounded-full bg-sahelGold px-5 py-3 text-sm font-black text-sahelBlack transition hover:bg-white md:inline-flex"
        >
          Devis gratuit
          <MessageCircle className="h-4 w-4" />
        </a>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-sahelGold hover:text-sahelGold md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-sahelBlack/95 px-4 pb-4 pt-2 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-2xl px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-sahelGold"
              >
                {item.label}
              </Link>
            ))}

            <a
              href={createWhatsappLink()}
              target="_blank"
              rel="noreferrer"
              onClick={closeMenu}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-sahelGold px-5 py-3 text-sm font-black text-sahelBlack transition hover:bg-white"
            >
              Demander un devis gratuit
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}