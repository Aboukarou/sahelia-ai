# Feuille de route v1.0

## État de la reconstruction au 2 octobre 2026

Branche de travail : `rebuild/foundation-v1`.

Le socle d’identité et d’entreprise ainsi que les premiers écrans sont implémentés. La consultation des membres et la gestion des sessions du compte sont intégrées au dashboard.

Le dernier commit fonctionnel de référence est `670a872`, consacré au panneau des sessions du dashboard.

Les phases ci-dessous décrivent la progression du produit. Une fonctionnalité implémentée ne signifie pas que toute sa phase est validée pour la production.

## Phase 0 — Fondation

Socle en place :

- Monorepo et conventions
- Web Next.js et API NestJS compilables
- Prisma 6 et PostgreSQL
- Modèle initial utilisateurs, entreprises, memberships, sessions et audit

À confirmer avant de déclarer la phase entièrement validée :

- Exécution de la CI sur la branche actuelle
- Reproduction du démarrage depuis un environnement neuf

## Phase 1 — Identité et entreprises

Implémenté :

- Inscription, connexion et renouvellement des tokens
- Déconnexion courante et globale
- Rôles SUPER_ADMIN, ADMIN et CLIENT
- Memberships OWNER, ADMIN et MEMBER
- Consultation de l’entreprise et modification autorisée de son nom
- Consultation paginée des membres selon les permissions
- Consultation paginée des sessions actives du compte
- Révocation individuelle d’une autre session
- Vérification des sessions révoquées et expirées lors de l’authentification JWT
- Journalisation des événements implémentés

Vérifié :

- Types, lint, tests et build API
- Dernier passage complet : 7 suites et 64 tests réussis
- Révocation réelle suivie du refus des access tokens et refresh tokens
- Révocation depuis le dashboard avec deux sessions de navigateur distinctes

À compléter :

- Tests d’intégration et E2E automatisés contre PostgreSQL
- Isolation entre plusieurs comptes et entreprises
- Renouvellements concurrents et révocations
- Rollback réel en cas d’échec d’audit

Les invitations, changements de rôle, désactivations et transferts de propriété nécessitent une spécification avant leur implémentation.

## Phase 2 — Expérience produit

Implémenté :

- Présentation verte et dorée du socle
- Landing et écrans d’authentification
- Dashboard : profil, entreprise, membres et sessions
- Chargement, erreurs avec réessai, listes vides et pagination
- Marque SAHELIA AI dans les écrans du socle

Vérifié :

- Types, lint et build web
- Affichage des zones contrôlées sur ordinateur et en émulation mobile
- Parcours manuel de révocation d’une session depuis le dashboard

À compléter :

- Vérifications tablette et appareils réels
- Accessibilité : clavier, focus et lecteur d’écran
- Vérification visuelle complète des états d’erreur et de liste vide
- Internationalisation FR/AR/EN avec RTL

## Phase 3 — CRM commercial

À spécifier puis construire :

- Leads, pipeline, attribution et relances
- Messages, notifications et temps réel
- Qualification et scoring IA

## Phase 4 — WhatsApp Business

À spécifier puis construire :

- Embedded Signup et comptes WhatsApp par entreprise
- Webhooks authentifiés et idempotents
- Conversations, réponses IA et transfert humain
- Observabilité et reprise sur erreur

## Phase 5 — Devis et facturation

À spécifier puis construire :

- Produits, devis et PDF
- Paiements et abonnements
- Transitions PENDING, PAID, FAILED et CANCELLED
- Actions sensibles réservées au SUPER_ADMIN

Aucun plan payant ne doit être activé sans paiement confirmé.

## Phase 6 — Production

À préparer et valider :

- Tests unitaires, intégration, E2E et isolation multi-tenant
- Sécurité, performance et accessibilité
- Configuration de production et documentation d’exploitation
- Déploiement, sauvegardes et tests de restauration
- Supervision et client pilote

## Prochain jalon

Consolider le socle avant une nouvelle fonctionnalité majeure :

1. Actualiser la documentation.
2. Vérifier la CI et les commandes de validation du monorepo.
3. Spécifier puis automatiser les tests d’intégration et E2E prioritaires.
4. Compléter les vérifications responsive et d’accessibilité.
5. Définir le périmètre du premier module CRM.

Chaque chantier avance par étapes, avec des résultats de vérification observés avant de passer au suivant.
