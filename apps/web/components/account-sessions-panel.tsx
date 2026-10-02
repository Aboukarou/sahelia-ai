"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAuth,
  type AccountSession,
  type AccountSessionsResponse,
} from "./auth-provider";
import styles from "./account-sessions-panel.module.css";

const PAGE_SIZE = 20;
const MAX_PAGE = 100000;

function sessionLabel(userAgent: string | null): string {
  if (!userAgent) return "Appareil non identifié";
  if (/WindowsPowerShell|PowerShell/i.test(userAgent)) return "PowerShell";

  let browser = "Navigateur";
  if (/Edg\//i.test(userAgent)) browser = "Microsoft Edge";
  else if (/OPR\//i.test(userAgent)) browser = "Opera";
  else if (/Firefox|FxiOS/i.test(userAgent)) browser = "Firefox";
  else if (/Chrome|CriOS/i.test(userAgent)) browser = "Chrome";
  else if (/Safari/i.test(userAgent)) browser = "Safari";

  let device = "";
  if (/iPhone/i.test(userAgent)) device = "iPhone";
  else if (/iPad/i.test(userAgent)) device = "iPad";
  else if (/Android/i.test(userAgent)) device = "Android";
  else if (/Windows/i.test(userAgent)) device = "Windows";
  else if (/Macintosh|Mac OS X/i.test(userAgent)) device = "macOS";
  else if (/Linux/i.test(userAgent)) device = "Linux";

  return device ? `${browser} · ${device}` : browser;
}

function displayDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date indisponible";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AccountSessionsPanel({ disabled = false }: {
  disabled?: boolean;
}) {
  const { getSessions, revokeSession } = useAuth();
  const [data, setData] = useState<AccountSessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const mounted = useRef(false);
  const loadVersion = useRef(0);
  const requestedPage = useRef(1);
  const mutationInFlight = useRef(false);

  const load = useCallback(
    async (page: number) => {
      const currentLoad = ++loadVersion.current;
      requestedPage.current = page;

      setLoading(true);
      setLoadError(null);

      try {
        let result = await getSessions(page, PAGE_SIZE);

        if (!mounted.current || currentLoad !== loadVersion.current) return;

        const lastPage = Math.max(
          1,
          Math.min(result.pagination.totalPages, MAX_PAGE),
        );

        if (result.pagination.page > lastPage) {
          requestedPage.current = lastPage;
          result = await getSessions(lastPage, PAGE_SIZE);

          if (!mounted.current || currentLoad !== loadVersion.current) return;
        }

        setData(result);
      } catch (caught: unknown) {
        if (!mounted.current || currentLoad !== loadVersion.current) return;

        setLoadError(
          caught instanceof Error
            ? caught.message
            : "Impossible de charger vos sessions.",
        );
      } finally {
        if (mounted.current && currentLoad === loadVersion.current) {
          setLoading(false);
        }
      }
    },
    [getSessions],
  );

  useEffect(() => {
    mounted.current = true;
    void load(1);

    return () => {
      mounted.current = false;
      loadVersion.current += 1;
    };
  }, [load]);

  async function handleRevoke(session: AccountSession) {
    if (
      disabled ||
      loading ||
      mutationInFlight.current ||
      session.isCurrent
    ) {
      return;
    }

    if (
      !window.confirm(
        `Déconnecter la session « ${sessionLabel(session.userAgent)} » ?`,
      )
    ) {
      return;
    }

    mutationInFlight.current = true;
    setRevokingId(session.id);
    setActionError(null);
    setSuccess(null);

    try {
      await revokeSession(session.id);

      if (!mounted.current) return;

      setSuccess("La session a été déconnectée.");
      await load(requestedPage.current);
    } catch (caught: unknown) {
      if (!mounted.current) return;

      setActionError(
        caught instanceof Error
          ? caught.message
          : "Impossible de déconnecter cette session.",
      );
    } finally {
      mutationInFlight.current = false;

      if (mounted.current) {
        setRevokingId(null);
      }
    }
  }

  const busy = disabled || loading || revokingId !== null;
  const pagination = data?.pagination;

  const canGoPrevious =
    !busy &&
    !loadError &&
    pagination !== undefined &&
    pagination.totalPages > 0 &&
    pagination.page > 1;

  const canGoNext =
    !busy &&
    !loadError &&
    pagination !== undefined &&
    pagination.page < pagination.totalPages &&
    pagination.page < MAX_PAGE;

  function refresh() {
    if (busy) return;
    setActionError(null);
    setSuccess(null);
    void load(requestedPage.current);
  }

  function changePage(page: number) {
    if (busy || loadError) return;
    setActionError(null);
    setSuccess(null);
    void load(page);
  }

  return (
    <section
      className={`panel ${styles.panel}`}
      aria-labelledby="account-sessions-title"
      aria-busy={loading || revokingId !== null}
    >
      <div className={styles.heading}>
        <div className={styles.headingText}>
          <p className="eyebrow">Sécurité du compte</p>
          <h2 id="account-sessions-title">Mes sessions</h2>
          <p className="muted">
            Consultez vos connexions actives et déconnectez une autre session.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={refresh}
        >
          {loading ? "Chargement…" : "Actualiser"}
        </button>
      </div>

      <p className={`muted ${styles.help}`}>
        Les appareils sont identifiés à partir des informations du navigateur.
        Les dates sont affichées dans le fuseau horaire de cet appareil.
      </p>

      {success && (
        <p className="notice" role="status">
          {success}
        </p>
      )}

      {actionError && (
        <p className="error-message" role="alert">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className={`muted ${styles.state}`} role="status">
          Chargement de vos sessions…
        </p>
      ) : loadError ? (
        <div className={styles.state}>
          <p className="error-message" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            className={`button secondary ${styles.retry}`}
            disabled={disabled || revokingId !== null}
            onClick={() => void load(requestedPage.current)}
          >
            Réessayer
          </button>
        </div>
      ) : data ? (
        <>
          <p className={`muted ${styles.summary}`} role="status">
            {data.pagination.total}{" "}
            {data.pagination.total === 1
              ? "session active"
              : "sessions actives"}
          </p>

          {data.items.length === 0 ? (
            <p className={`muted ${styles.empty}`}>
              Aucune session à afficher sur cette page.
            </p>
          ) : (
            <ul className={styles.list} aria-label="Sessions actives du compte">
              {data.items.map((session) => (
                <li key={session.id} className={styles.session}>
                  <div className={styles.sessionHeading}>
                    <h3>{sessionLabel(session.userAgent)}</h3>

                    {session.isCurrent && (
                      <span className={`status-badge ${styles.current}`}>
                        Cet appareil
                      </span>
                    )}
                  </div>

                  <dl className={styles.details}>
                    <div>
                      <dt>Connexion créée</dt>
                      <dd>
                        <time dateTime={session.createdAt}>
                          {displayDate(session.createdAt)}
                        </time>
                      </dd>
                    </div>

                    <div>
                      <dt>Dernier renouvellement</dt>
                      <dd>
                        <time dateTime={session.lastUsedAt}>
                          {displayDate(session.lastUsedAt)}
                        </time>
                      </dd>
                    </div>

                    <div>
                      <dt>Expiration de la session</dt>
                      <dd>
                        <time dateTime={session.expiresAt}>
                          {displayDate(session.expiresAt)}
                        </time>
                      </dd>
                    </div>

                    <div>
                      <dt>Adresse IP</dt>
                      <dd>{session.ipAddress ?? "Non disponible"}</dd>
                    </div>
                  </dl>

                  <details className={styles.technical}>
                    <summary>Informations du navigateur</summary>
                    <p>{session.userAgent ?? "Non disponibles"}</p>
                  </details>

                  {session.isCurrent ? (
                    <p className={`muted ${styles.currentHelp}`}>
                      Pour fermer cette session, utilisez « Se déconnecter »
                      en haut de la page.
                    </p>
                  ) : (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className="button secondary"
                        disabled={busy}
                        onClick={() => void handleRevoke(session)}
                        aria-label={`Déconnecter la session ${sessionLabel(session.userAgent)} créée le ${displayDate(session.createdAt)}`}
                      >
                        {revokingId === session.id
                          ? "Déconnexion…"
                          : "Déconnecter cette session"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <nav className={styles.pagination} aria-label="Pagination des sessions">
            <p className="muted">
              {data.pagination.totalPages === 0
                ? "Aucune page"
                : `Page ${data.pagination.page} sur ${data.pagination.totalPages}`}
            </p>

            <div className={styles.paginationActions}>
              <button
                type="button"
                className="button secondary"
                disabled={!canGoPrevious}
                onClick={() => changePage(data.pagination.page - 1)}
              >
                Précédent
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={!canGoNext}
                onClick={() => changePage(data.pagination.page + 1)}
              >
                Suivant
              </button>
            </div>
          </nav>
        </>
      ) : null}
    </section>
  );
}