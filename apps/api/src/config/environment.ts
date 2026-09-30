type Environment = Record<string, string | undefined>;
type ValidatedEnvironment = Record<string, string | number | undefined>;

function requireSecret(environment: Environment, name: string): void {
  const value = environment[name];

  if (!value || value.length < 32 || value.startsWith("replace-with")) {
    throw new Error(`${name} doit contenir au moins 32 caractères aléatoires.`);
  }
}

function positiveInteger(
  environment: Environment,
  name: string,
  defaultValue: number,
): number {
  const rawValue = environment[name];
  const value = rawValue === undefined ? defaultValue : Number(rawValue.trim());

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} doit être un entier strictement positif.`);
  }

  return value;
}

export function validateEnvironment(
  environment: Environment,
): ValidatedEnvironment {
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL est obligatoire.");
  }

  requireSecret(environment, "JWT_ACCESS_SECRET");
  requireSecret(environment, "JWT_REFRESH_SECRET");

  return {
    ...environment,
    JWT_ACCESS_TTL_SECONDS: positiveInteger(
      environment,
      "JWT_ACCESS_TTL_SECONDS",
      900,
    ),
    JWT_REFRESH_TTL_DAYS: positiveInteger(
      environment,
      "JWT_REFRESH_TTL_DAYS",
      30,
    ),
    AUTH_MAX_LOGIN_ATTEMPTS: positiveInteger(
      environment,
      "AUTH_MAX_LOGIN_ATTEMPTS",
      5,
    ),
    AUTH_LOCK_MINUTES: positiveInteger(environment, "AUTH_LOCK_MINUTES", 15),
  };
}
