export const WHATSAPP_NUMBER = "23593973220";

export const DEFAULT_WHATSAPP_MESSAGE = `Bonjour SAHELIA AI, je veux un site web.

Mon entreprise :
Secteur :
Objectif du site :
Budget approximatif :`;

export function createWhatsappLink(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
