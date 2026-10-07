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

Le 4 octobre 2026, le contrôle complet local et la CI du commit `e92a6aa` ont réussi avec 64 tests unitaires et sept tests HTTP contre PostgreSQL. Les tests HTTP utilisent une base dédiée et ne constituent pas des tests du frontend dans un navigateur.

Le 6 octobre 2026, la suite étendue a réussi localement avec 13 tests HTTP. Le lint et les vérifications TypeScript de l’API et des tests E2E ont également réussi. La CI du commit `fee61ec` a ensuite réussi, y compris `pnpm check` et les tests HTTP PostgreSQL.

Ces résultats ne constituent pas une validation complète de production.

## Tests HTTP avec PostgreSQL

La suite `apps/api/test/tenant-isolation.e2e-spec.ts` démarre une instance Nest sur un port disponible. Il n’est pas nécessaire de démarrer l’API habituelle ni le frontend.

Elle vérifie 13 scénarios :

- Les sept scénarios d’isolation existants : séparation des entreprises, des membres et des sessions ; modification de A sans changement de B ; refus des révocations croisées dans les deux sens ; déconnexion et refus des access tokens et refresh tokens.
- Un membership ADMIN peut consulter les membres et modifier le nom de l’entreprise.
- Un membership MEMBER peut lire l’entreprise, mais reçoit HTTP 403 pour la consultation des membres et la modification du nom.
- Le passage de OWNER à MEMBER retire immédiatement ces permissions avec le même access token.
- La désactivation de l’adhésion, de l’entreprise ou de l’utilisateur refuse le token existant avec HTTP 401, dans trois tests distincts.

Les changements de rôle et de statut sont réalisés directement dans les données de test, puis restaurés dans des blocs `finally`. Ils n’ajoutent aucune route de gestion des membres. Les tests de désactivation vérifient aussi que le compte B conserve son accès.

### Préparer la base locale

Créer une base dédiée nommée exactement `sahelia_ai_test`. Sous Windows, adapter le chemin de `psql.exe` à l’installation PostgreSQL :

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -W -v ON_ERROR_STOP=1 -c "CREATE DATABASE sahelia_ai_test;"
```

Si la base existe déjà, ne pas la supprimer. Vérifier la connexion :

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -d sahelia_ai_test -W -v ON_ERROR_STOP=1 -c "SELECT current_database(), current_user;"
```

Depuis la racine du monorepo, préparer l’URL dans la fenêtre PowerShell utilisée pour les tests :

```powershell
$testDbPassword = Read-Host "Mot de passe PostgreSQL postgres" -AsSecureString
$testDbCredential = [System.Net.NetworkCredential]::new("", $testDbPassword)

try {
    $testDbEncodedPassword = [uri]::EscapeDataString($testDbCredential.Password)
    $env:TEST_DATABASE_URL = "postgresql://postgres:${testDbEncodedPassword}@localhost:5432/sahelia_ai_test?schema=public"
} finally {
    Remove-Variable testDbPassword, testDbCredential, testDbEncodedPassword -ErrorAction SilentlyContinue
}
```

Ne pas afficher ni versionner cette URL : elle contient le mot de passe. La variable reste disponible uniquement dans cette fenêtre et les processus qu’elle lance.

Appliquer les migrations en ciblant explicitement la base de test, sans modifier `.env` :

```powershell
$previousDatabaseUrl = $env:DATABASE_URL

try {
    if (-not $env:TEST_DATABASE_URL) {
        throw "TEST_DATABASE_URL est obligatoire."
    }
    $testDbTarget = [uri]$env:TEST_DATABASE_URL
    if ($testDbTarget.AbsolutePath -ne "/sahelia_ai_test") {
        throw "La base ciblée doit être sahelia_ai_test."
    }

    $env:DATABASE_URL = $env:TEST_DATABASE_URL
    pnpm.cmd db:migrate:deploy
    if ($LASTEXITCODE -ne 0) {
        throw "L’application des migrations a échoué."
    }

    pnpm.cmd --filter @sahelia/database exec prisma migrate status
    if ($LASTEXITCODE -ne 0) {
        throw "La vérification des migrations a échoué."
    }
} finally {
    $env:DATABASE_URL = $previousDatabaseUrl
}
```

### Exécuter les tests

Dans cette même fenêtre, depuis la racine :

```powershell
pnpm.cmd db:generate
pnpm.cmd --filter @sahelia/database build
pnpm.cmd --filter @sahelia/api test:e2e
```

Arrêter la procédure si une commande échoue. Le résultat attendu de Jest est une suite et 13 tests réussis.

`pnpm.cmd check` exécute le formatage, le lint, les types, les tests unitaires et les builds. Les tests HTTP sont lancés séparément par `test:e2e` et ne sont pas mis en cache par Turborepo.

La préparation Jest exige une URL PostgreSQL locale ciblant `sahelia_ai_test`, avec le schéma `public`. Elle génère des secrets JWT temporaires. La suite vérifie aussi le nom de la base connectée avant de créer les comptes.

Chaque exécution crée deux comptes avec des adresses uniques. Le nettoyage supprime leurs audits, sessions, memberships, utilisateurs et entreprises. Il ne réinitialise pas la base entière. Une interruption brutale peut laisser des données de test.

### Exécution dans GitHub Actions

Le workflow démarre un service PostgreSQL 18 temporaire, génère le client Prisma, applique les migrations, exécute `pnpm check`, puis `pnpm --filter @sahelia/api test:e2e`.

Les identifiants du service PostgreSQL inscrits dans le workflow sont propres à ce conteneur temporaire. Les secrets JWT des tests sont générés au démarrage.

Validation la plus récente observée le 6 octobre 2026 : [CI réussie du commit fee61ec](https://github.com/Aboukarou/sahelia-ai/actions/runs/37437095377).

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
