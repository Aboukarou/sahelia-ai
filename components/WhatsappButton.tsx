import { MessageCircle } from "lucide-react";
import { createWhatsappLink } from "./whatsapp";

export function WhatsappButton() {
  return (
    <a
      href={createWhatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Contacter SAHELIA AI sur WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sahelGreen text-white shadow-2xl ring-4 ring-sahelGreen/25 transition hover:scale-105 hover:bg-sahelGold hover:text-sahelBlack"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
