"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useAuth, type BusinessProfile } from "./auth-provider";

const membershipRoles = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
} as const;

export function BusinessPanel() {
  const { getBusiness, updateBusiness } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const mounted = useRef(false);
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const currentLoad = ++loadVersion.current;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await getBusiness();

      if (!mounted.current || currentLoad !== loadVersion.current) return;

      setBusiness(result);
      setName(result.name);
    } catch (caught: unknown) {
      if (!mounted.current || currentLoad !== loadVersion.current) return;

      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger votre entreprise.",
      );
    } finally {
      if (mounted.current && currentLoad === loadVersion.current) {
        setLoading(false);
      }
    }
  }, [getBusiness]);

  useEffect(() => {
    mounted.current = true;
    void load();

    return () => {
      mounted.current = false;
      loadVersion.current += 1;
    };
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business?.canEdit || saving) return;

    const nextName = name.trim();

    if (nextName.length < 2 || nextName.length > 120) {
      setError("Le nom doit contenir entre 2 et 120 caractères.");
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateBusiness(nextName);

      if (!mounted.current) return;

      setBusiness(result);
      setName(result.name);
      setSuccess("Le nom de votre entreprise a été enregistré.");
    } catch (caught: unknown) {
      if (!mounted.current) return;

      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible d’enregistrer les modifications.",
      );
    } finally {
      if (mounted.current) {
        setSaving(false);
      }
    }
  }

  const hasChanges = business !== null && name.trim() !== business.name;

  return (
    <section className="panel" aria-labelledby="business-title">
      <p className="eyebrow">Mon entreprise</p>
      <h2 id="business-title">
        {business?.name ?? "Informations de l’entreprise"}
      </h2>

      {loading ? (
        <p className="muted" role="status">
          Chargement de votre entreprise…
        </p>
      ) : !business ? (
        <div>
          <p className="error-message" role="alert">
            {error ?? "L’entreprise est indisponible."}
          </p>
          <button
            type="button"
            className="button secondary full-width"
            onClick={() => void load()}
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <dl className="details">
            <div>
              <dt>Identifiant public</dt>
              <dd>{business.slug}</dd>
            </div>
            <div>
              <dt>Votre accès</dt>
              <dd>
                {business.membershipRole
                  ? membershipRoles[business.membershipRole]
                  : "Super administrateur"}
              </dd>
            </div>
          </dl>

          {business.canEdit ? (
            <form onSubmit={handleSubmit}>
              <fieldset disabled={saving}>
                <label htmlFor="business-name">Nom de l’entreprise</label>
                <input
                  id="business-name"
                  name="businessName"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  autoComplete="organization"
                  minLength={2}
                  maxLength={120}
                  aria-describedby="business-name-help"
                  required
                />
                <p id="business-name-help" className="field-help">
                  Le changement du nom conserve votre identifiant public.
                </p>

                {error && (
                  <p className="error-message" role="alert">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="notice" role="status">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  className="button primary full-width"
                  disabled={!hasChanges || saving}
                  aria-busy={saving}
                >
                  {saving ? "Enregistrement…" : "Enregistrer le nom"}
                </button>
              </fieldset>
            </form>
          ) : (
            <p className="muted">
              Le propriétaire et les administrateurs peuvent modifier les
              informations de cette entreprise.
            </p>
          )}
        </>
      )}
    </section>
  );
}
