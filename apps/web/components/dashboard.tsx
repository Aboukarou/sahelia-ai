"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { BusinessPanel } from "./business-panel";
import { BusinessMembersPanel } from "./business-members-panel";
import { AccountSessionsPanel } from "./account-sessions-panel";

const accountRoles = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  CLIENT: "Client",
} as const;

export function Dashboard() {
  const router = useRouter();
  const { profile, status, error, restore, logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [router, status]);

  async function handleLogout(allSessions: boolean) {
    if (pending) return;

    if (
      allSessions &&
      !window.confirm(
        "Voulez-vous déconnecter votre compte sur tous les appareils ?",
      )
    ) {
      return;
    }

    setPending(true);
    setLogoutError(null);

    try {
      await logout(allSessions);
      router.replace("/login");
    } catch (caught: unknown) {
      setLogoutError(
        caught instanceof Error
          ? caught.message
          : "La déconnexion a échoué. Réessayez.",
      );
    } finally {
      setPending(false);
    }
  }

  if (status === "error") {
    return (
      <main className="centered-page">
        <section className="state-card">
          <Link href="/" className="brand">
            SAHELIA AI
          </Link>
          <h1>Votre espace est momentanément inaccessible</h1>
          <p className="muted" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="button primary"
            onClick={() => void restore()}
          >
            Réessayer
          </button>
        </section>
      </main>
    );
  }

  if (status !== "authenticated" || !profile) {
    return (
      <main className="centered-page">
        <div className="state-card">
          <Link href="/" className="brand">
            SAHELIA AI
          </Link>
          <p role="status">Chargement de votre espace…</p>
        </div>
      </main>
    );
  }

  const canViewMembers =
    profile.business !== null &&
    (profile.role === "SUPER_ADMIN" ||
      profile.business.membershipRole === "OWNER" ||
      profile.business.membershipRole === "ADMIN");

  return (
    <div className="dashboard-shell">
      <header className="site-header">
        <Link href="/" className="brand">
          SAHELIA AI
        </Link>
        <button
          type="button"
          className="button secondary"
          disabled={pending}
          onClick={() => void handleLogout(false)}
        >
          {pending ? "Veuillez patienter…" : "Se déconnecter"}
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Tableau de bord</p>
            <h1>Bonjour, {profile.name}.</h1>
            <p className="lead">
              Retrouvez les informations de votre compte et gérez votre
              entreprise.
            </p>
          </div>
          <span className="status-badge">Session connectée</span>
        </div>

        {logoutError && (
          <p className="error-message" role="alert">
            {logoutError}
          </p>
        )}

        <div className="dashboard-grid">
          <section className="panel" aria-labelledby="account-title">
            <p className="eyebrow">Mon compte</p>
            <h2 id="account-title">Votre profil</h2>
            <dl className="details">
              <div>
                <dt>Nom complet</dt>
                <dd>{profile.name}</dd>
              </div>
              <div>
                <dt>Adresse email</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>Rôle du compte</dt>
                <dd>{accountRoles[profile.role]}</dd>
              </div>
            </dl>
          </section>

          {profile.business ? (
            <BusinessPanel key={profile.business.id} />
          ) : (
            <section className="panel">
              <p className="eyebrow">Mon entreprise</p>
              <h2>Aucune entreprise associée</h2>
              <p className="muted">
                Votre compte ne possède actuellement aucune entreprise active.
              </p>
            </section>
          )}
        </div>

        {canViewMembers && profile.business && (
          <BusinessMembersPanel
            key={`${profile.id}:${profile.business.id}:${profile.business.membershipRole}:${profile.role}`}
          />
        )}

        <AccountSessionsPanel key={profile.id} disabled={pending} />

        <section
          className="panel session-panel"
          aria-labelledby="session-title"
        >
          <div>
            <p className="eyebrow">Sécurité</p>
            <h2 id="session-title">Gérer vos connexions</h2>
            <p className="muted">
              Déconnectez toutes les sessions de votre compte, y compris celle
              de cet appareil.
            </p>
          </div>
          <button
            type="button"
            className="button secondary"
            disabled={pending}
            onClick={() => void handleLogout(true)}
          >
            Déconnecter tous les appareils
          </button>
        </section>
      </main>
    </div>
  );
}
