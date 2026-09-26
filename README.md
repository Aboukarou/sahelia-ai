# SAHELIA AI

SAHELIA AI est un SaaS commercial WhatsApp-first, multi-tenant et multilingue pour les entreprises africaines.

## Socle technique

- Next.js 15 + React 19 pour le web
- NestJS 11 pour l'API
- Prisma 6 + PostgreSQL pour les données
- PNPM + Turborepo pour le monorepo
- TypeScript strict de bout en bout

## Démarrage

Prérequis : Node.js 20.19+ et PNPM 10.15.1.

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate:deploy
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

## API d'identité

- `POST /api/auth/register` — crée l'administrateur client, son entreprise et son membership `OWNER`
- `POST /api/auth/login` — ouvre une session et retourne un access token
- `POST /api/auth/refresh` — renouvelle et fait tourner le refresh token sécurisé
- `POST /api/auth/logout` — révoque la session courante
- `POST /api/auth/logout-all` — révoque toutes les sessions de l'utilisateur
- `GET /api/auth/me` — retourne le profil et l'entreprise active

Le refresh token n'est jamais stocké en clair : seul son condensat SHA-256 est conservé en base. Le cookie est `HttpOnly`, `SameSite=Lax` et `Secure` en production.

Consultez [docs/ROADMAP.md](docs/ROADMAP.md) pour l'ordre de construction.
