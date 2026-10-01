"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CLIENT";
  business: {
    id: string;
    name: string;
    slug: string;
    membershipRole: "OWNER" | "ADMIN" | "MEMBER";
  } | null;
}

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  membershipRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  canEdit: boolean;
}

export interface BusinessMember {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export interface BusinessMembersResponse {
  items: BusinessMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AuthResponse {
  accessToken: string;
  profile: AuthProfile;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  businessName: string;
}

type AuthStatus = "loading" | "authenticated" | "anonymous" | "error";

interface AuthContextValue {
  profile: AuthProfile | null;
  status: AuthStatus;
  error: string | null;
  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: (allSessions?: boolean) => Promise<void>;
  getBusiness: () => Promise<BusinessProfile>;
  updateBusiness: (name: string) => Promise<BusinessProfile>;
  getBusinessMembers: (
    page?: number,
    limit?: number,
  ) => Promise<BusinessMembersResponse>;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
    );
  }

  if (!response.ok) {
    let message = "La demande a échoué. Réessayez.";

    try {
      const data: unknown = await response.json();

      if (typeof data === "object" && data !== null && "message" in data) {
        const value = data.message;

        if (typeof value === "string") {
          message = value;
        } else if (Array.isArray(value)) {
          message = value
            .filter((item): item is string => typeof item === "string")
            .join(" ");
        }
      }
    } catch {
      // Le serveur peut retourner une erreur sans corps JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

let refreshInFlight: Promise<AuthResponse> | null = null;

function refreshSession(): Promise<AuthResponse> {
  if (!refreshInFlight) {
    refreshInFlight = request<AuthResponse>("/auth/refresh", {
      method: "POST",
    }).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const accessToken = useRef<string | null>(null);
  const operation = useRef(0);

  const acceptSession = useCallback((result: AuthResponse) => {
    accessToken.current = result.accessToken;
    setProfile(result.profile);
    setStatus("authenticated");
    setError(null);
  }, []);

  const clearSession = useCallback(() => {
    accessToken.current = null;
    setProfile(null);
    setStatus("anonymous");
    setError(null);
  }, []);

  const restore = useCallback(async () => {
    const currentOperation = ++operation.current;

    setStatus("loading");
    setError(null);

    try {
      const result = await refreshSession();

      if (operation.current === currentOperation) {
        acceptSession(result);
      }
    } catch (caught: unknown) {
      if (operation.current !== currentOperation) return;

      if (caught instanceof ApiError && caught.status === 401) {
        clearSession();
      } else {
        accessToken.current = null;
        setProfile(null);
        setStatus("error");
        setError(errorMessage(caught));
      }
    }
  }, [acceptSession, clearSession]);

  useEffect(() => {
    void restore();

    return () => {
      operation.current += 1;
    };
  }, [restore]);

  const login = useCallback(
    async (email: string, password: string) => {
      const currentOperation = ++operation.current;

      const result = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (operation.current !== currentOperation) {
        throw new Error("La session a changé. Réessayez.");
      }

      acceptSession(result);
    },
    [acceptSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const currentOperation = ++operation.current;

      const result = await request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (operation.current !== currentOperation) {
        throw new Error("La session a changé. Réessayez.");
      }

      acceptSession(result);
    },
    [acceptSession],
  );

  const authenticatedRequest = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const currentOperation = operation.current;

      const ensureCurrentSession = () => {
        if (operation.current !== currentOperation) {
          throw new Error("La session a changé. Réessayez.");
        }
      };

      const renew = async (): Promise<string> => {
        try {
          const result = await refreshSession();
          ensureCurrentSession();
          acceptSession(result);
          return result.accessToken;
        } catch (caught: unknown) {
          if (
            operation.current === currentOperation &&
            caught instanceof ApiError &&
            caught.status === 401
          ) {
            clearSession();
          }

          throw caught;
        }
      };

      const execute = async (token: string): Promise<T> => {
        const headers = new Headers(options.headers);
        headers.set("Authorization", `Bearer ${token}`);

        const result = await request<T>(path, { ...options, headers });
        ensureCurrentSession();

        return result;
      };

      let token = accessToken.current;

      if (!token) {
        token = await renew();
      }

      try {
        return await execute(token);
      } catch (caught: unknown) {
        ensureCurrentSession();

        if (!(caught instanceof ApiError) || caught.status !== 401) {
          throw caught;
        }

        // Réessayer une seule fois avec un token renouvelé.
        const newToken = await renew();

        try {
          return await execute(newToken);
        } catch (retryError: unknown) {
          if (
            operation.current === currentOperation &&
            retryError instanceof ApiError &&
            retryError.status === 401
          ) {
            clearSession();
          }

          throw retryError;
        }
      }
    },
    [acceptSession, clearSession],
  );

  const getBusiness = useCallback(
    () =>
      authenticatedRequest<BusinessProfile>("/business/current", {
        method: "GET",
      }),
    [authenticatedRequest],
  );

  const updateBusiness = useCallback(
    async (name: string): Promise<BusinessProfile> => {
      const business = await authenticatedRequest<BusinessProfile>(
        "/business/current",
        {
          method: "PATCH",
          body: JSON.stringify({ name }),
        },
      );

      setProfile((current) => {
        if (!current?.business || current.business.id !== business.id) {
          return current;
        }

        return {
          ...current,
          business: {
            ...current.business,
            name: business.name,
            slug: business.slug,
          },
        };
      });

      return business;
    },
    [authenticatedRequest],
  );

  const getBusinessMembers = useCallback(
    (
      page = 1,
      limit = 20,
    ): Promise<BusinessMembersResponse> => {
      if (!Number.isInteger(page) || page < 1 || page > 100000) {
        return Promise.reject(new Error("Le numéro de page est invalide."));
      }

      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return Promise.reject(new Error("La taille de page est invalide."));
      }

      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      return authenticatedRequest<BusinessMembersResponse>(
        `/business/current/members?${query.toString()}`,
        { method: "GET" },
      );
    },
    [authenticatedRequest],
  );

  const logout = useCallback(
    async (allSessions = false) => {
      if (allSessions) {
        await authenticatedRequest<void>("/auth/logout-all", {
          method: "POST",
        });
      } else {
        await request<void>("/auth/logout", { method: "POST" });
      }

      operation.current += 1;
      clearSession();
    },
    [authenticatedRequest, clearSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      status,
      error,
      restore,
      login,
      register,
      logout,
      getBusiness,
      updateBusiness,
      getBusinessMembers,
    }),
    [
      profile,
      status,
      error,
      restore,
      login,
      register,
      logout,
      getBusiness,
      updateBusiness,
      getBusinessMembers,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider.");
  }

  return context;
}