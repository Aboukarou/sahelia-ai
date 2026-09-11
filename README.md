# SAHELIA AI

SAHELIA AI est un SaaS commercial WhatsApp-first, multi-tenant et multilingue pour les entreprises africaines.

## Socle technique

- Next.js 15 + React 19 pour le web
- NestJS 11 pour l'API
- Prisma 6 + PostgreSQL pour les données
- PNPM + Turborepo pour le monorepo
- TypeScript strict de bout en bout

## Démarrage

Prérequis : Node.js 20.19+ et PNPM 11.

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Web : `http://localhost:3000`  
API : `http://localhost:5000/api`  
Santé API : `http://localhost:5000/api/health`

## Règles du projet

- Une fonctionnalité majeure est spécifiée avant son implémentation.
- Toute ressource métier est isolée par entreprise côté serveur.
- Aucun plan payant n'est activé sans paiement confirmé.
- Les secrets restent hors de Git.
- Chaque étape doit passer formatage, lint, types et build.

Consultez [docs/ROADMAP.md](docs/ROADMAP.md) pour l'ordre de construction.
