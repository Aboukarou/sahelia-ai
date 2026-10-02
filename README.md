# SAHELIA AI

SAHELIA AI est un projet de SaaS commercial WhatsApp-first, multi-tenant et multilingue pour les entreprises africaines.

La reconstruction actuelle avance sur la branche `rebuild/foundation-v1`. Le socle disponible couvre l’identité, les informations de l’entreprise, la consultation des membres et les sessions du compte. Le CRM, WhatsApp, la facturation et les langues supplémentaires restent à construire.

## Socle technique

- Next.js 15 + React 19 pour le web
- NestJS 11 pour l’API
- Prisma 6 + PostgreSQL pour les données
- PNPM + Turborepo pour le monorepo
- TypeScript strict de bout en bout

## Démarrage

Prérequis : Node.js 20.19+ et PNPM 10.15.1.

Copier `.env.example` vers `.env`, puis renseigner la connexion PostgreSQL et remplacer les secrets d’exemple avant de démarrer.

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev
```

Sous Windows PowerShell, utiliser `pnpm.cmd` si l’exécution de `pnpm.ps1` est bloquée. La copie du fichier se fait avec :

```powershell
Copy-Item .env.example .env
```

Ne pas écraser un fichier `.env` déjà configuré.

Adresses locales :

- Web : `http://localhost:3000`
- API : `http://localhost:5000/api`
- Santé API : `http://localhost:5000/api/health`

## Fonctionnalités disponibles

- Inscription, connexion et restauration de session
- Déconnexion de la session courante ou de toutes les sessions
- Dashboard avec profil et informations de l’entreprise
- Modification du nom de l’entreprise selon les permissions
- Consultation paginée des membres pour les accès autorisés
- Consultation paginée des sessions actives du compte
- Révocation d’une autre session du compte depuis le dashboard
- États de chargement, d’erreur avec réessai et de liste vide
- Présentation responsive verte et dorée avec la marque SAHELIA AI

La gestion des membres par invitation, modification de rôle ou suppression n’est pas disponible à cette étape.

## API disponible

Les chemins ci-dessous incluent le préfixe `/api`.

| Méthode | Route                           | Fonction                                                            |
| ------- | ------------------------------- | ------------------------------------------------------------------- |
| POST    | `/api/auth/register`            | Créer un utilisateur CLIENT, son entreprise et son membership OWNER |
| POST    | `/api/auth/login`               | Ouvrir une session                                                  |
| POST    | `/api/auth/refresh`             | Renouveler les tokens de la session                                 |
| POST    | `/api/auth/logout`              | Révoquer la session portée par le cookie de refresh                 |
| POST    | `/api/auth/logout-all`          | Révoquer toutes les sessions du compte                              |
| GET     | `/api/auth/me`                  | Consulter le profil                                                 |
| GET     | `/api/auth/sessions`            | Lister les sessions actives du compte                               |
| DELETE  | `/api/auth/sessions/:sessionId` | Révoquer une autre session du compte                                |
| GET     | `/api/business/current`         | Consulter l’entreprise sélectionnée                                 |
| PATCH   | `/api/business/current`         | Modifier le nom de l’entreprise selon les permissions               |
| GET     | `/api/business/current/members` | Consulter les membres selon les permissions                         |

Les listes de membres et de sessions acceptent `page` et `limit` et retournent `items` et `pagination`.

## Vérifications

Depuis la racine du monorepo, sous PowerShell :

```powershell
pnpm.cmd --filter @sahelia/web typecheck
pnpm.cmd --filter @sahelia/web lint
pnpm.cmd --filter @sahelia/web build

pnpm.cmd --filter @sahelia/api typecheck
pnpm.cmd --filter @sahelia/api lint
pnpm.cmd --filter @sahelia/api test
pnpm.cmd --filter @sahelia/api build
```

Ces vérifications ont réussi lors des étapes de construction correspondantes. Le dernier passage complet des tests API fourni contient 7 suites et 64 tests réussis.

Des vérifications manuelles ont également confirmé :

- La consultation des membres de l’entreprise
- L’affichage du dashboard et des sessions sur ordinateur et en émulation mobile
- La révocation d’une session par l’API, suivie du refus de son access token et de son refresh token avec HTTP 401
- La révocation depuis le dashboard d’une session privée distincte, puis son retour à la connexion après rechargement
- Le maintien de la session habituelle après cette révocation

Ces résultats ne constituent pas une validation complète de production ni une suite E2E automatisée.

## Règles du projet

- Une fonctionnalité majeure est spécifiée avant son implémentation.
- Toute ressource métier est isolée par entreprise côté serveur.
- Les sessions du compte restent limitées à leur propriétaire.
- Aucun plan payant n’est activé sans paiement confirmé.
- Les secrets restent hors de Git.
- Chaque étape doit passer formatage, lint, types et build, ainsi que les tests adaptés au changement.
- Une vérification n’est déclarée réussie qu’après observation de son résultat.

Le refresh token est conservé dans un cookie HttpOnly ; seul son condensat SHA-256 est stocké en base. Le cookie utilise SameSite=Lax et Secure en production.

Consulter [la documentation d’identité et de sécurité](docs/IDENTITY_SECURITY.md) et [la feuille de route](docs/ROADMAP.md).
