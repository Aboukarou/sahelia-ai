# Identité et sécurité multi-tenant

## Garanties de cette étape

- Toute inscription crée atomiquement un utilisateur `CLIENT`, une entreprise et un membership `OWNER`.
- Les mots de passe sont hachés avec bcrypt, facteur 12.
- Les access tokens expirent après 15 minutes par défaut.
- Les refresh tokens sont placés dans un cookie `HttpOnly` et renouvelés à chaque refresh.
- Seul le condensat SHA-256 du refresh token est stocké en base.
- Les sessions peuvent être révoquées individuellement ou globalement.
- Cinq connexions échouées verrouillent le compte pendant 15 minutes par défaut.
- Les connexions, échecs, verrouillages et déconnexions sont journalisés.
- Le guard multi-tenant vérifie le membership actif et l'état de l'entreprise côté serveur.
- `SUPER_ADMIN` est le seul rôle global pouvant cibler une entreprise sans membership.

## Configuration obligatoire

Copier `.env.example` vers `.env`, puis remplacer les secrets d'exemple par deux valeurs aléatoires différentes d'au moins 32 caractères.

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm check
```

## Contrat des routes

### `POST /api/auth/register`

```json
{
  "email": "proprietaire@entreprise.td",
  "password": "une-phrase-secrete-solide",
  "name": "Nom du propriétaire",
  "businessName": "Entreprise Exemple"
}
```

### `POST /api/auth/login`

```json
{
  "email": "proprietaire@entreprise.td",
  "password": "une-phrase-secrete-solide"
}
```

L'inscription, la connexion et le refresh retournent un access token et un profil public. Le refresh token reste exclusivement dans le cookie sécurisé.

## Étape suivante

Construire les écrans d'inscription et de connexion Enterprise Gold V2, puis exécuter un test E2E réel contre PostgreSQL avant d'ouvrir le développement du dashboard.
