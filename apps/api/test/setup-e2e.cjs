const { randomBytes } = require("node:crypto");

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL est obligatoire pour les tests PostgreSQL.",
  );
}

let target;

try {
  target = new URL(databaseUrl);
} catch {
  throw new Error("TEST_DATABASE_URL doit être une URL PostgreSQL valide.");
}

if (
  !["postgresql:", "postgres:"].includes(target.protocol) ||
  !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
  target.pathname !== "/sahelia_ai_test" ||
  target.searchParams.get("schema") !== "public"
) {
  throw new Error(
    "Les tests exigent la base locale sahelia_ai_test avec le schema public.",
  );
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = databaseUrl;
process.env.JWT_ACCESS_SECRET = randomBytes(48).toString("hex");
process.env.JWT_REFRESH_SECRET = randomBytes(48).toString("hex");
process.env.JWT_ACCESS_TTL_SECONDS = "900";
process.env.JWT_REFRESH_TTL_DAYS = "30";
process.env.AUTH_MAX_LOGIN_ATTEMPTS = "5";
process.env.AUTH_LOCK_MINUTES = "15";
process.env.AUTH_COOKIE_NAME = "sahelia_e2e_refresh";
process.env.WEB_URL = "http://localhost:3000";
