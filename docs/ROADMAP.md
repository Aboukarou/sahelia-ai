# Feuille de route v1.0

## Phase 0 — Fondation

- Monorepo, versions et conventions
- Web et API minimaux compilables
- Prisma 6 et modèle multi-tenant initial
- CI de validation

## Phase 1 — Identité et entreprises

- Inscription, connexion, refresh, déconnexion et sessions
- Rôles `SUPER_ADMIN`, `ADMIN`, `CLIENT`
- Entreprises, membres et ownership multi-tenant
- Journal d'audit

## Phase 2 — Expérience produit

- Design System Enterprise Gold V2
- Landing, authentification et dashboards
- Responsive mobile, tablette et desktop
- Internationalisation FR/AR/EN avec RTL

## Phase 3 — CRM commercial

- Leads, pipeline, attribution et relances
- Messages, notifications et temps réel
- Qualification et scoring IA

## Phase 4 — WhatsApp Business

- Embedded Signup et comptes WhatsApp par entreprise
- Webhooks authentifiés et idempotents
- Conversations, réponses IA et transfert humain
- Observabilité et reprise sur erreur

## Phase 5 — Devis et facturation

- Produits, devis et PDF
- Paiements et abonnements
- Transitions `PENDING`, `PAID`, `FAILED`, `CANCELLED`
- Actions sensibles réservées au `SUPER_ADMIN`

## Phase 6 — Production

- Tests unitaires, intégration, E2E et isolation multi-tenant
- Sécurité, performance, accessibilité et documentation
- Déploiement, sauvegarde, supervision et client pilote
