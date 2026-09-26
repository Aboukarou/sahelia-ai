type Environment = Record<string, string | undefined>;

function requireSecret(environment: Environment, name: string): void {
  const value = environment[name];
  if (!value || value.length < 32 || value.startsWith("replace-with")) {
    throw new Error(`${name} doit contenir au moins 32 caractères aléatoires.`);
  }
}

export function validateEnvironment(environment: Environment): Environment {
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL est obligatoire.");
  }

  requireSecret(environment, "JWT_ACCESS_SECRET");
  requireSecret(environment, "JWT_REFRESH_SECRET");

  return environment;
}
