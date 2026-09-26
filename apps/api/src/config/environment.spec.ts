import { validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  const validEnvironment = {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/sahelia_ai",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
  };

  it("accepte une configuration de sécurité complète", () => {
    expect(validateEnvironment(validEnvironment)).toBe(validEnvironment);
  });

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
