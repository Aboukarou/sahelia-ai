"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAuth,
  type BusinessMembersResponse,
} from "./auth-provider";
import styles from "./business-members-panel.module.css";

const membershipRoles = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
} as const;

const PAGE_SIZE = 20;
const MAX_PAGE = 100000;

export function BusinessMembersPanel() {
  const { getBusinessMembers } = useAuth();
  const [data, setData] = useState<BusinessMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const loadVersion = useRef(0);
  const requestedPage = useRef(1);

  const load = useCallback(
    async (page: number) => {
      const currentLoad = ++loadVersion.current;
      requestedPage.current = page;

      setLoading(true);
      setError(null);

      try {
        let result = await getBusinessMembers(page, PAGE_SIZE);

        if (!mounted.current || currentLoad !== loadVersion.current) return;

        // Si le nombre de pages a diminué, revenir à la dernière page.
        if (
          result.pagination.totalPages > 0 &&
          result.pagination.page > result.pagination.totalPages
        ) {
          const lastPage = Math.min(
            result.pagination.totalPages,
            MAX_PAGE,
          );

          requestedPage.current = lastPage;
          result = await getBusinessMembers(lastPage, PAGE_SIZE);

          if (!mounted.current || currentLoad !== loadVersion.current) return;
        }

        setData(result);
      } catch (caught: unknown) {
        if (!mounted.current || currentLoad !== loadVersion.current) return;

        setError(
          caught instanceof Error
            ? caught.message
            : "Impossible de charger les membres de votre entreprise.",
        );
      } finally {
        if (mounted.current && currentLoad === loadVersion.current) {
          setLoading(false);
        }
      }
    },
    [getBusinessMembers],
  );

  useEffect(() => {
    mounted.current = true;
    void load(1);

    return () => {
      mounted.current = false;
      loadVersion.current += 1;
    };
  }, [load]);

  const pagination = data?.pagination;
  const canGoPrevious =
    !loading &&
    !error &&
    pagination !== undefined &&
    pagination.totalPages > 0 &&
    pagination.page > 1;

  const canGoNext =
    !loading &&
    !error &&
    pagination !== undefined &&
    pagination.page < pagination.totalPages &&
    pagination.page < MAX_PAGE;

  const firstItem =
    data && data.items.length > 0
      ? (data.pagination.page - 1) * data.pagination.limit + 1
      : 0;

  const lastItem =
    data && data.items.length > 0
      ? firstItem + data.items.length - 1
      : 0;

  function changePage(page: number) {
    if (loading || error) return;
    void load(page);
  }

  return (
    <section
      className={`panel ${styles.panel}`}
      aria-labelledby="members-title"
      aria-busy={loading}
    >
      <div className={styles.heading}>
        <div className={styles.headingText}>
          <p className="eyebrow">Mon équipe</p>
          <h2 id="members-title">Membres de l’entreprise</h2>
          <p className="muted">
            Consultez les membres, leurs rôles et leurs statuts.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          disabled={loading}
          onClick={() => void load(requestedPage.current)}
        >
          {loading ? "Chargement…" : "Actualiser"}
        </button>
      </div>

      {loading ? (
        <p className={`muted ${styles.state}`} role="status">
          Chargement des membres…
        </p>
      ) : error ? (
        <div className={styles.state}>
          <p className="error-message" role="alert">
            {error}
          </p>
          <button
            type="button"
            className={`button secondary ${styles.retry}`}
            onClick={() => void load(requestedPage.current)}
          >
            Réessayer
          </button>
        </div>
      ) : data ? (
        <>
          <p className={`muted ${styles.summary}`} role="status">
            {data.pagination.total === 0
              ? "Aucun membre dans cette entreprise."
              : `${firstItem}–${lastItem} sur ${data.pagination.total} ${
                  data.pagination.total === 1 ? "membre" : "membres"
                }`}
          </p>

          {data.items.length === 0 ? (
            <div className={styles.empty}>
              <h3>
                {data.pagination.total === 0
                  ? "Aucun membre à afficher"
                  : "Cette page ne contient aucun membre"}
              </h3>
              <p className="muted">
                {data.pagination.total === 0
                  ? "La liste sera affichée ici lorsque des membres seront présents."
                  : "Actualisez la liste pour retrouver les membres disponibles."}
              </p>
            </div>
          ) : (
            <ul className={styles.list} aria-label="Liste des membres">
              {data.items.map((member) => (
                <li key={member.id} className={styles.member}>
                  <div className={styles.identity}>
                    <h3>{member.user.name}</h3>
                    <p className={styles.email}>{member.user.email}</p>
                  </div>

                  <dl className={styles.memberDetails}>
                    <div>
                      <dt>Rôle</dt>
                      <dd>{membershipRoles[member.role]}</dd>
                    </div>

                    <div>
                      <dt>Adhésion</dt>
                      <dd>
                        <span
                          className={`${styles.badge} ${
                            member.isActive ? styles.active : styles.inactive
                          }`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt>Compte utilisateur</dt>
                      <dd>
                        <span
                          className={`${styles.badge} ${
                            member.user.isActive
                              ? styles.active
                              : styles.inactive
                          }`}
                        >
                          {member.user.isActive ? "Actif" : "Désactivé"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}

          <nav
            className={styles.pagination}
            aria-label="Pagination des membres"
          >
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
                aria-label="Afficher la page précédente des membres"
              >
                Précédent
              </button>

              <button
                type="button"
                className="button secondary"
                disabled={!canGoNext}
                onClick={() => changePage(data.pagination.page + 1)}
                aria-label="Afficher la page suivante des membres"
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