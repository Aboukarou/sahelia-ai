import { validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  const validEnvironment = {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/sahelia_ai",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
  };

  it("accepte une configuration de sécurité complète", () => {
    expect(validateEnvironment(validEnvironment)).toEqual({
      ...validEnvironment,
      JWT_ACCESS_TTL_SECONDS: 900,
      JWT_REFRESH_TTL_DAYS: 30,
      AUTH_MAX_LOGIN_ATTEMPTS: 5,
      AUTH_LOCK_MINUTES: 15,
    });
  });

  it("convertit les paramètres numériques fournis en chaînes", () => {
    const result = validateEnvironment({
      ...validEnvironment,
      JWT_ACCESS_TTL_SECONDS: "1200",
      JWT_REFRESH_TTL_DAYS: "7",
      AUTH_MAX_LOGIN_ATTEMPTS: "3",
      AUTH_LOCK_MINUTES: "10",
    });

    expect(result.JWT_ACCESS_TTL_SECONDS).toBe(1200);
    expect(result.JWT_REFRESH_TTL_DAYS).toBe(7);
    expect(result.AUTH_MAX_LOGIN_ATTEMPTS).toBe(3);
    expect(result.AUTH_LOCK_MINUTES).toBe(10);
  });

  it.each(["", "0", "-1", "1.5", "abc"])(
    "refuse une durée JWT invalide : %p",
    (value) => {
      expect(() =>
        validateEnvironment({
          ...validEnvironment,
          JWT_ACCESS_TTL_SECONDS: value,
        }),
      ).toThrow(
        "JWT_ACCESS_TTL_SECONDS doit être un entier strictement positif.",
      );
    },
  );

  it("refuse une base de données absente", () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, DATABASE_URL: undefined }),
    ).toThrow("DATABASE_URL est obligatoire");
  });

  it("refuse les secrets par défaut ou trop courts", () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_ACCESS_SECRET: "replace-with-at-least-32-random-characters",
      }),
    ).toThrow("JWT_ACCESS_SECRET");
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_REFRESH_SECRET: "court" }),
    ).toThrow("JWT_REFRESH_SECRET");
  });
});
