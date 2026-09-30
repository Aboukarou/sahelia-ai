import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SAHELIA AI — Assistant commercial WhatsApp",
    template: "%s | SAHELIA AI",
  },
  description:
    "Transformez WhatsApp en moteur commercial pour votre entreprise.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
