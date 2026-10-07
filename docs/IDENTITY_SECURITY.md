# Identité et sécurité multi-tenant

## Périmètre actuel

Le socle couvre l’inscription, la connexion, le renouvellement des tokens, les déconnexions, les informations de l’entreprise, la consultation des membres et les sessions du compte.

## Comportements implémentés

- L’inscription crée atomiquement un utilisateur CLIENT, une entreprise et un membership OWNER. L’ouverture de la session intervient ensuite.
- Les mots de passe sont hachés avec bcrypt, facteur 12.
- Les access tokens expirent après 15 minutes par défaut.
- Le refresh token est transmis dans un cookie HttpOnly.
- Seul son condensat SHA-256 est stocké en base.
- Le renouvellement conserve l’identifiant et la date de création de la session, et actualise `lastUsedAt`.
- Le renouvellement refuse une session révoquée, expirée, appartenant à un autre utilisateur ou dont le condensat du token ne correspond pas.
- L’authentification JWT vérifie en base la session et l’état actuel de l’utilisateur.
- Un access token encore valide cryptographiquement est refusé si sa session est révoquée ou expirée.
- Cinq connexions échouées verrouillent le compte pendant 15 minutes par défaut.
- Les événements d’authentification et les révocations individuelles sont journalisés.
- Les accès métier vérifient les permissions et l’état de l’entreprise côté serveur.

Le cookie utilise `SameSite=Lax`, le chemin `/api/auth` et `Secure` en production.

## Configuration

Copier `.env.example` vers `.env`, puis renseigner PostgreSQL et remplacer les deux secrets JWT d’exemple par des valeurs aléatoires différentes d’au moins 32 caractères.

Ne pas versionner les secrets ni transmettre les tokens ou cookies dans les comptes rendus de tests.

```powershell
pnpm.cmd db:generate
pnpm.cmd db:migrate:deploy
```

## Inscription et connexion

### POST /api/auth/register

```json
{
  "email": "proprietaire@entreprise.td",
  "password": "une-phrase-secrete-solide",
  "name": "Nom du propriétaire",
  "businessName": "Entreprise Exemple"
}
```

### POST /api/auth/login

```json
{
  "email": "proprietaire@entreprise.td",
  "password": "une-phrase-secrete-solide"
}
```

L’inscription, la connexion et le renouvellement retournent un access token et un profil public. Le refresh token est transmis par le cookie HttpOnly.

## Membres de l’entreprise

### GET /api/business/current/members?page=1&limit=20

La lecture est limitée à l’entreprise sélectionnée côté serveur.

Le service autorise :

- Un membership actif OWNER ou ADMIN
- Le rôle global SUPER_ADMIN, sous réserve du passage des contrôles d’authentification et d’accès en amont

Le rôle ADMIN du compte ne remplace pas un membership autorisé.

Le service refuse une entreprise absente ou désactivée. Les résultats incluent les memberships inactifs et l’état du compte utilisateur.

Chaque élément contient :

- `id`, `role`, `isActive`, `createdAt`
- `user.id`, `user.name`, `user.email`, `user.isActive`

Aucune route de gestion des membres n’est ajoutée à cette étape.

## Sessions du compte

### GET /api/auth/sessions?page=1&limit=20

La liste contient uniquement les sessions du compte authentifié qui ne sont pas révoquées et dont l’expiration est strictement future.

Chaque élément contient :

- `id`, `businessId`
- `userAgent`, `ipAddress`
- `createdAt`, `lastUsedAt`, `expiresAt`
- `isCurrent`

`isCurrent` compare l’identifiant de la session à celui du token utilisé pour la requête.

La liste est personnelle : même SUPER_ADMIN ne reçoit pas les sessions des autres utilisateurs.

### DELETE /api/auth/sessions/:sessionId

Cette route révoque uniquement une autre session du compte authentifié.

- La session courante est refusée avec HTTP 400.
- Une session absente du compte est refusée avec HTTP 404.
- Une session déjà révoquée ou expirée ne provoque pas de nouvelle écriture.
- Une révocation réussie retourne HTTP 204.
- La révocation et l’événement AUTH_SESSION_REVOKED sont écrits dans une transaction.

Pour fermer la session courante, utiliser `POST /api/auth/logout`. Pour fermer toutes les sessions du compte, utiliser `POST /api/auth/logout-all`.

## Pagination

Les listes de membres et de sessions acceptent :

- `page` : entier de 1 à 100000, valeur par défaut 1
- `limit` : entier de 1 à 100, valeur par défaut 20

Elles retournent :

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Une page au-delà de la dernière peut retourner une liste vide. Le frontend adapte les commandes aux bornes de la pagination.

## Vérifications réalisées

### Tests automatisés et CI

Le dernier passage complet fourni des tests API contient 7 suites et 64 tests réussis, dont :

- 15 tests du service de consultation des membres
- 16 tests de la stratégie JWT
- 14 tests du service des sessions

Le contrôle complet local `pnpm.cmd check` a réussi : formatage, lint, types, tests et builds.

La CI GitHub du commit `e92a6aa` a réussi le 4 octobre 2026 : migrations PostgreSQL, contrôle complet avec 64 tests unitaires, puis sept tests HTTP.

Le 6 octobre 2026, les vérifications TypeScript et le lint API ont réussi localement, suivis des 13 tests HTTP. La CI du commit `fee61ec` a également réussi, avec `pnpm check` puis les tests HTTP PostgreSQL.

[Consulter la dernière exécution CI validée](https://github.com/Aboukarou/sahelia-ai/actions/runs/37437095377).

### Tests HTTP automatisés — extension validée le 6 octobre 2026

La suite `apps/api/test/tenant-isolation.e2e-spec.ts` a réussi lors de plusieurs exécutions locales et dans GitHub Actions. Elle utilise la vraie application Nest, ses contrôles de validation et d’authentification, ainsi qu’une base PostgreSQL dédiée.

Les 13 tests vérifient :

1. Chaque compte reçoit sa propre entreprise.
2. Chaque compte reçoit uniquement le membre de son entreprise.
3. Modifier le nom de A conserve son slug et laisse B inchangée.
4. Les listes de sessions sont séparées et identifient la session courante.
5. A reçoit HTTP 404 en tentant de révoquer la session de B ; B reste utilisable.
6. B reçoit HTTP 404 en tentant de révoquer la session de A ; A reste utilisable.
7. Les déconnexions retournent HTTP 204 ; les access tokens et refresh tokens sont ensuite refusés avec HTTP 401.
8. Un membership ADMIN actif peut consulter les membres et modifier le nom de l’entreprise.
9. Un membership MEMBER actif peut lire l’entreprise avec `canEdit: false`, mais reçoit HTTP 403 pour la lecture des membres et la modification ; le nom reste inchangé.
10. Le passage de OWNER à MEMBER retire immédiatement les permissions avec le même access token ; les opérations interdites reçoivent HTTP 403.
11. Une adhésion désactivée fait refuser le token existant avec HTTP 401.
12. Une entreprise désactivée fait refuser le token existant avec HTTP 401.
13. Un utilisateur désactivé fait refuser le token existant avec HTTP 401.

Pour chacun des trois états désactivés, les tests vérifient le refus de `/api/auth/me`, des sessions, de la lecture de l’entreprise, de ses membres et de la modification du nom. Le compte B conserve son accès. Après restauration de l’état actif, le compte A peut de nouveau consulter son profil.

Les mutations de rôle et de statut utilisent Prisma uniquement sur les données de test. Chaque scénario restaure les valeurs modifiées dans un bloc `finally`. Aucun endpoint ni mécanisme de gestion des membres n’est ajouté.

La configuration exige `TEST_DATABASE_URL` ciblant la base locale `sahelia_ai_test`, schéma `public`. Les secrets JWT sont temporaires. La suite vérifie le nom de la base connectée avant les inscriptions et démarre Nest sur un port disponible.

Le nettoyage est limité aux données des comptes créés pour cette exécution. Une interruption brutale peut laisser des données résiduelles. Aucune réinitialisation globale de la base n’est effectuée.

La commande dédiée est `pnpm.cmd --filter @sahelia/api test:e2e`. Elle est distincte de `pnpm.cmd check`. La procédure de création de la base, de configuration de l’URL et de migration est documentée dans le [README](../README.md#tests-http-avec-postgresql).

Cette suite couvre les requêtes HTTP et PostgreSQL ; elle ne teste pas les interactions du frontend dans un navigateur.

### Révocation d’une session

Les vérifications manuelles ont confirmé :

1. Une session de test pouvait consulter `/api/auth/me`.
2. Sa révocation retournait HTTP 204.
3. Son access token était ensuite refusé avec HTTP 401.
4. Son refresh token était ensuite refusé avec HTTP 401.
5. Une session privée distincte pouvait être révoquée depuis le dashboard.
6. Après rechargement, cette fenêtre privée revenait à la connexion.
7. La fenêtre habituelle conservait son accès au dashboard.

Les fenêtres du test doivent utiliser des sessions différentes. Deux onglets partageant le même cookie ne constituent pas deux sessions indépendantes.

### Isolation entre deux comptes et entreprises — 3 octobre 2026

Les scénarios ont été exécutés manuellement avec PowerShell contre l’API locale et sa base PostgreSQL.

Deux comptes de test A et B ont été inscrits avec des adresses uniques et des cookies séparés. Chaque compte possédait une entreprise distincte et un membership OWNER.

Les résultats observés sont les suivants :

| Scénario                                                   | Résultat observé                                                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Consultation de l’entreprise avec le compte A              | L’identifiant correspondait à l’entreprise de A                                                    |
| Consultation de l’entreprise avec le compte B              | L’identifiant correspondait à l’entreprise de B                                                    |
| Consultation des membres avec A                            | Un seul résultat : l’utilisateur A, OWNER, avec membership et compte actifs                        |
| Consultation des membres avec B                            | Un seul résultat : l’utilisateur B, OWNER, avec membership et compte actifs                        |
| Modification du nom de l’entreprise A                      | Le nouveau nom était retourné puis conservé lors d’une nouvelle lecture ; le slug restait inchangé |
| Lecture de B après la modification de A                    | L’identifiant, le nom, le slug et `updatedAt` de B restaient inchangés                             |
| Consultation des sessions avec A et B                      | Chaque compte recevait une seule session, identifiée comme courante et associée à son entreprise   |
| Comparaison des sessions                                   | Les identifiants des sessions A et B étaient distincts                                             |
| Tentative de révocation de la session B avec le compte A   | HTTP 404 ; B pouvait encore consulter son profil et retrouver sa session courante                  |
| Tentative de révocation de la session A avec le compte B   | HTTP 404 ; A pouvait encore consulter son profil et retrouver sa session courante                  |
| Déconnexion finale de A et B avec leurs cookies respectifs | HTTP 204 pour chaque compte                                                                        |

Les comptes et entreprises de test restent en base. Aucune suppression de données n’a été effectuée.

Cette vérification couvre les scénarios exécutés avec deux propriétaires d’entreprises distinctes. Elle ne couvre pas tous les rôles, les memberships multiples, les entreprises désactivées ni les accès concurrents.

## Vérifications restantes

- Étendre les tests HTTP aux rôles globaux ADMIN et SUPER_ADMIN, aux memberships multiples et à la sélection explicite d’une entreprise
- Automatiser les parcours du frontend dans un navigateur
- Tester les renouvellements concurrents et leur interaction avec une révocation
- Vérifier le rollback réel de la transaction si l’écriture d’audit échoue
- Valider les cookies, les origines autorisées et HTTPS en environnement de production
- Compléter les contrôles d’accessibilité et les essais sur appareils réels

Le socle n’est pas déclaré prêt pour la production sur la seule base des tests unitaires, des 13 tests HTTP et des vérifications manuelles actuelles.
