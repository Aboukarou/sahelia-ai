"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "./auth-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login, register, status, error: sessionError, restore } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRegister = mode === "register";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");

    setError(null);

    if (isRegister && password !== String(data.get("confirmPassword") ?? "")) {
      setError("Les deux mots de passe doivent être identiques.");
      return;
    }

    setPending(true);

    try {
      if (isRegister) {
        await register({
          email,
          password,
          name: String(data.get("name") ?? "").trim(),
          businessName: String(data.get("businessName") ?? "").trim(),
        });
      } else {
        await login(email, password);
      }

      form.reset();
      router.replace("/dashboard");
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "La demande a échoué. Réessayez.",
      );
    } finally {
      setPending(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <main className="centered-page">
        <div className="state-card" role="status">
          Vérification de votre session…
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link href="/" className="brand">
          SAHELIA AI
        </Link>
        <p className="eyebrow">Votre espace entreprise</p>
        <h1>
          {isRegister
            ? "Votre entreprise. Un nouvel élan."
            : "Heureux de vous retrouver."}
        </h1>
        <p className="lead">
          {isRegister
            ? "Créez votre compte et l’espace de votre entreprise en une seule étape."
            : "Connectez-vous pour retrouver votre espace SAHELIA AI."}
        </p>
        <div className="intro-note">
          <strong>Un espace dédié à votre entreprise</strong>
          <p>Votre compte et vos accès sont associés à votre organisation.</p>
        </div>
      </section>

      <section className="form-card" aria-labelledby="form-title">
        <h2 id="form-title">{isRegister ? "Créer mon compte" : "Connexion"}</h2>
        <p className="muted">
          {isRegister
            ? "Renseignez vos informations pour démarrer."
            : "Utilisez l’adresse email de votre compte."}
        </p>

        {status === "error" && (
          <div className="notice" role="status">
            <p>{sessionError}</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => void restore()}
            >
              Vérifier à nouveau la session
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={pending}>
            {isRegister && (
              <>
                <label htmlFor="name">Nom complet</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                />

                <label htmlFor="businessName">Nom de l’entreprise</label>
                <input
                  id="businessName"
                  name="businessName"
                  autoComplete="organization"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </>
            )}

            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
            />

            <label htmlFor="password">Mot de passe</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 12 : undefined}
                maxLength={128}
                aria-describedby={isRegister ? "password-help" : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-controls="password"
                aria-pressed={showPassword}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>

            {isRegister && (
              <>
                <p id="password-help" className="field-help">
                  Entre 12 et 128 caractères.
                </p>
                <label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </>
            )}

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="button primary full-width"
              aria-busy={pending}
            >
              {pending
                ? "Veuillez patienter…"
                : isRegister
                  ? "Créer mon compte"
                  : "Me connecter"}
            </button>
          </fieldset>
        </form>

        <p className="form-footer">
          {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
          <Link href={isRegister ? "/login" : "/register"}>
            {isRegister ? "Se connecter" : "Créer un compte"}
          </Link>
        </p>
        <Link href="/" className="back-link">
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}
