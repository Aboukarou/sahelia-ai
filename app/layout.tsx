import type { Metadata } from "next";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { WhatsappButton } from "../components/WhatsappButton";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sahelia.ai"),

  title: {
    default: "SAHELIA AI — Création de sites web & automatisation IA",
    template: "%s | SAHELIA AI",
  },

  description:
    "Agence africaine spécialisée dans la création de sites web professionnels, l'intégration WhatsApp et les solutions d'intelligence artificielle pour entreprises.",

  keywords: [
    "SAHELIA AI",
    "site web Tchad",
    "création site web Afrique",
    "agence digitale Tchad",
    "automatisation WhatsApp",
    "landing page",
    "développement web",
    "intelligence artificielle Afrique",
    "SEO Afrique",
    "site internet entreprise",
  ],

  authors: [
    {
      name: "SAHELIA AI",
    },
  ],

  creator: "SAHELIA AI",

  openGraph: {
    title: "SAHELIA AI — Création de sites web & automatisation IA",
    description:
      "Sites web professionnels, WhatsApp Business, automatisation et intelligence artificielle pour entreprises africaines.",
    url: "https://sahelia.ai",
    siteName: "SAHELIA AI",

    images: [
      {
        url: "/sahelia-logo.png",
        width: 1200,
        height: 1200,
        alt: "Logo SAHELIA AI",
      },
    ],

    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SAHELIA AI",
    description:
      "Création de sites web professionnels, WhatsApp Business et automatisation IA.",
    images: ["/sahelia-logo.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-sahelBlack text-white antialiased">
        <Navbar />

        <main>{children}</main>

        <Footer />

        <WhatsappButton />
      </body>
    </html>
  );
}