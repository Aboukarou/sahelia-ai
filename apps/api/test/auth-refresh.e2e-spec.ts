import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { Prisma } from "@sahelia/database";
import cookieParser from "cookie-parser";
import { createHash, randomUUID } from "node:crypto";
import { AppModule } from "../src/app.module";
import { AuthSessionsService } from "../src/auth/auth-sessions.service";
import type { AuthProfile, RequestUser } from "../src/auth/auth.types";
import { PrismaService } from "../src/database/prisma.service";

interface AuthResponse {
  accessToken: string;
  profile: AuthProfile;
}

interface TestAccount extends AuthResponse {
  cookie: string;
}

describe("Renouvellement HTTP des sessions avec PostgreSQL", () => {
  const runId = randomUUID();
  const emails: string[] = [];

  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let databaseVerified = false;
  let baseUrl = "";

  function client(): PrismaService {
    if (!prisma || !databaseVerified) {
      throw new Error("La base de test n’est pas vérifiée.");
    }

    return prisma;
  }

  async function request(
    route: string,
    method = "GET",
    cookie?: string,
    accessToken?: string,
    body?: Record<string, string>,
  ): Promise<Response> {
    const headers: Record<string, string> = {};

    if (cookie) headers.Cookie = cookie;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (body) headers["Content-Type"] = "application/json";

    return fetch(`${baseUrl}${route}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  }

  function readCookie(response: Response): string {
    const header = response.headers
      .getSetCookie()
      .find((value) => value.startsWith("sahelia_e2e_refresh="));

    const cookie = header?.split(";")[0];

    if (!cookie) {
      throw new Error("Cookie de session absent.");
    }

    return cookie;
  }

  function cookieHash(cookie: string): string {
    const separator = cookie.indexOf("=");

    if (separator < 0) {
      throw new Error("Cookie de session invalide.");
    }

    const token = decodeURIComponent(cookie.slice(separator + 1));

    return createHash("sha256").update(token).digest("hex");
  }

  async function register(password = randomUUID()): Promise<TestAccount> {
    const index = emails.length;
    const email = `e2e.refresh.${runId}.${index}@example.com`;
    emails.push(email);

    const response = await request(
      "/auth/register",
      "POST",
      undefined,
      undefined,
      {
        email,
        password,
        name: "Utilisateur renouvellement",
        businessName: `E2E renouvellement ${runId} ${index}`,
      },
    );

    expect(response.status).toBe(201);

    const result = (await response.json()) as AuthResponse;

    return { ...result, cookie: readCookie(response) };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();

    const connectedPrisma = app.get<PrismaService>(PrismaService);
    prisma = connectedPrisma;

    const databases = await connectedPrisma.$queryRaw<
      Array<{ name: string }>
    >`SELECT current_database() AS name`;

    if (databases[0]?.name !== "sahelia_ai_test") {
      throw new Error("La connexion doit cibler sahelia_ai_test.");
    }

    databaseVerified = true;

    await app.listen(0, "127.0.0.1");
    baseUrl = `${await app.getUrl()}/api`;
  }, 60_000);

  afterAll(async () => {
    try {
      if (prisma && databaseVerified) {
        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: {
            id: true,
            memberships: { select: { businessId: true } },
          },
        });

        const userIds = users.map((user) => user.id);
        const businessIds = [
          ...new Set(
            users.flatMap((user) =>
              user.memberships.map((membership) => membership.businessId),
            ),
          ),
        ];

        await prisma.$transaction(async (transaction) => {
          await transaction.auditLog.deleteMany({
            where: {
              OR: [
                { actorId: { in: userIds } },
                { businessId: { in: businessIds } },
              ],
            },
          });

          await transaction.refreshSession.deleteMany({
            where: { userId: { in: userIds } },
          });

          await transaction.membership.deleteMany({
            where: { userId: { in: userIds } },
          });

          await transaction.user.deleteMany({
            where: { id: { in: userIds } },
          });

          await transaction.business.deleteMany({
            where: { id: { in: businessIds } },
          });
        });
      }
    } finally {
      await app?.close();
    }
  }, 30_000);

  it("renouvelle le cookie, conserve la session et refuse l’ancien token", async () => {
    const account = await register();

    const before = await client().refreshSession.findFirstOrThrow({
      where: { userId: account.profile.id },
    });

    const response = await request("/auth/refresh", "POST", account.cookie);
    expect(response.status).toBe(200);

    const nextCookie = readCookie(response);
    const renewed = (await response.json()) as AuthResponse;

    expect(nextCookie === account.cookie).toBe(false);
    expect(renewed.profile.id).toBe(account.profile.id);

    const after = await client().refreshSession.findUniqueOrThrow({
      where: { id: before.id },
    });

    expect(after.createdAt).toEqual(before.createdAt);
    expect(after.expiresAt).toEqual(before.expiresAt);
    expect(after.revokedAt).toBeNull();
    expect(after.lastUsedAt.getTime()).toBeGreaterThanOrEqual(
      before.lastUsedAt.getTime(),
    );
    expect(after.tokenHash === cookieHash(nextCookie)).toBe(true);

    expect(
      await client().refreshSession.count({
        where: { userId: account.profile.id },
      }),
    ).toBe(1);

    expect(
      (await request("/auth/refresh", "POST", account.cookie)).status,
    ).toBe(401);

    expect(
      (await request("/auth/me", "GET", undefined, renewed.accessToken)).status,
    ).toBe(200);

    expect((await request("/auth/refresh", "POST", nextCookie)).status).toBe(
      200,
    );
  });

  it("accepte une seule des deux demandes utilisant le même refresh token", async () => {
    const account = await register();

    const responses = await Promise.all([
      request("/auth/refresh", "POST", account.cookie),
      request("/auth/refresh", "POST", account.cookie),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 401,
    ]);

    const winner = responses.find((response) => response.status === 200);
    const loser = responses.find((response) => response.status === 401);

    if (!winner || !loser) {
      throw new Error("Résultats concurrents inattendus.");
    }

    expect(loser.headers.getSetCookie()).toHaveLength(0);

    const nextCookie = readCookie(winner);
    const renewed = (await winner.json()) as AuthResponse;

    const session = await client().refreshSession.findFirstOrThrow({
      where: { userId: account.profile.id },
    });

    expect(session.tokenHash === cookieHash(nextCookie)).toBe(true);
    expect(session.revokedAt).toBeNull();

    expect(
      (await request("/auth/refresh", "POST", account.cookie)).status,
    ).toBe(401);

    expect(
      (await request("/auth/me", "GET", undefined, renewed.accessToken)).status,
    ).toBe(200);

    expect((await request("/auth/refresh", "POST", nextCookie)).status).toBe(
      200,
    );
  });

  it("refuse les tokens après déconnexion sans modifier la session révoquée", async () => {
    const account = await register();

    const response = await request("/auth/refresh", "POST", account.cookie);
    expect(response.status).toBe(200);

    const nextCookie = readCookie(response);
    const renewed = (await response.json()) as AuthResponse;

    expect((await request("/auth/logout", "POST", nextCookie)).status).toBe(
      204,
    );

    const revoked = await client().refreshSession.findFirstOrThrow({
      where: { userId: account.profile.id },
    });

    expect(revoked.revokedAt).not.toBeNull();

    expect((await request("/auth/refresh", "POST", nextCookie)).status).toBe(
      401,
    );

    expect(
      (await request("/auth/refresh", "POST", account.cookie)).status,
    ).toBe(401);

    expect(
      (await request("/auth/me", "GET", undefined, renewed.accessToken)).status,
    ).toBe(401);

    const after = await client().refreshSession.findUniqueOrThrow({
      where: { id: revoked.id },
    });

    expect(after.revokedAt).toEqual(revoked.revokedAt);
    expect(after.lastUsedAt).toEqual(revoked.lastUsedAt);
    expect(after.tokenHash === revoked.tokenHash).toBe(true);
  });

  it("refuse la rotation si la session est révoquée pendant le renouvellement", async () => {
    const account = await register();

    if (!app) {
      throw new Error("L’application de test n’est pas initialisée.");
    }

    const jwt = app.get<JwtService>(JwtService);

    let notifySigningStarted: () => void = () => {};
    let releaseSigning: () => void = () => {};

    const signingStarted = new Promise<void>((resolve) => {
      notifySigningStarted = resolve;
    });

    const signingReleased = new Promise<void>((resolve) => {
      releaseSigning = resolve;
    });

    // Suspend la première signature, après la lecture de la session.
    const signingSpy = jest
      .spyOn(jwt, "signAsync")
      .mockImplementationOnce(async () => {
        notifySigningStarted();
        await signingReleased;
        return "access-token-non-retourne";
      });

    let pendingRefresh: Promise<Response> | undefined;
    let signingTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
      pendingRefresh = request("/auth/refresh", "POST", account.cookie);

      const signingDeadline = new Promise<never>((_, reject) => {
        signingTimeout = setTimeout(() => {
          reject(new Error("Le renouvellement n’a pas atteint la signature."));
        }, 5_000);
      });

      await Promise.race([signingStarted, signingDeadline]);
      clearTimeout(signingTimeout);

      const logout = await request("/auth/logout", "POST", account.cookie);
      expect(logout.status).toBe(204);

      const revoked = await client().refreshSession.findFirstOrThrow({
        where: { userId: account.profile.id },
      });

      expect(revoked.revokedAt).not.toBeNull();

      releaseSigning();

      const response = await pendingRefresh;
      expect(response.status).toBe(401);
      expect(response.headers.getSetCookie()).toHaveLength(0);

      const after = await client().refreshSession.findUniqueOrThrow({
        where: { id: revoked.id },
      });

      expect(after.revokedAt).toEqual(revoked.revokedAt);
      expect(after.lastUsedAt).toEqual(revoked.lastUsedAt);
      expect(after.tokenHash === revoked.tokenHash).toBe(true);

      expect(
        (await request("/auth/me", "GET", undefined, account.accessToken))
          .status,
      ).toBe(401);
    } finally {
      clearTimeout(signingTimeout);
      releaseSigning();

      try {
        await pendingRefresh;
      } finally {
        signingSpy.mockRestore();
      }
    }
  });

  it("annule la révocation si l’audit échoue, puis permet une nouvelle tentative", async () => {
    const password = randomUUID();
    const emailIndex = emails.length;
    const owner = await register(password);
    const email = emails[emailIndex];

    if (!email) {
      throw new Error("L’adresse du compte de test est absente.");
    }

    const login = await request("/auth/login", "POST", undefined, undefined, {
      email,
      password,
    });

    expect(login.status).toBe(200);

    const other = (await login.json()) as AuthResponse;
    const otherCookie = readCookie(login);
    const database = client();

    const target = await database.refreshSession.findFirstOrThrow({
      where: {
        userId: owner.profile.id,
        tokenHash: cookieHash(otherCookie),
      },
    });

    if (!app) {
      throw new Error("L’application de test n’est pas initialisée.");
    }

    const jwt = app.get<JwtService>(JwtService);
    const user = jwt.decode<RequestUser>(owner.accessToken);

    if (!user) {
      throw new Error("Le token du compte de test est invalide.");
    }

    expect(user.userId).toBe(owner.profile.id);
    expect(user.sessionId).not.toBe(target.id);
    expect(other.profile.id).toBe(owner.profile.id);
    expect(target.revokedAt).toBeNull();

    expect(
      (await request("/auth/me", "GET", undefined, owner.accessToken)).status,
    ).toBe(200);

    expect(
      (await request("/auth/me", "GET", undefined, other.accessToken)).status,
    ).toBe(200);

    const auditWhere = {
      action: "AUTH_SESSION_REVOKED",
      actorId: owner.profile.id,
      entityType: "RefreshSession",
      entityId: target.id,
    } satisfies Prisma.AuditLogWhereInput;

    expect(await database.auditLog.count({ where: auditWhere })).toBe(0);

    const auditFailure = new Error("Échec d’audit contrôlé pour le test.");
    let auditAttempted = false;
    let revocationObservedInsideTransaction = false;

    // La transaction et la révocation utilisent réellement PostgreSQL.
    // Seule l’écriture d’audit est remplacée par une erreur contrôlée.
    const transactionAdapter = {
      $transaction: (
        operation: (transaction: Prisma.TransactionClient) => Promise<void>,
      ): Promise<void> =>
        database.$transaction(async (transaction) => {
          const auditDelegate = new Proxy(transaction.auditLog, {
            get(delegate, property, receiver) {
              if (property === "create") {
                return async (): Promise<never> => {
                  auditAttempted = true;

                  const inside =
                    await transaction.refreshSession.findUniqueOrThrow({
                      where: { id: target.id },
                    });

                  revocationObservedInsideTransaction =
                    inside.revokedAt !== null;

                  throw auditFailure;
                };
              }

              return Reflect.get(delegate, property, receiver) as unknown;
            },
          });

          const transactionWithFailingAudit = new Proxy(transaction, {
            get(delegate, property, receiver) {
              if (property === "auditLog") {
                return auditDelegate;
              }

              return Reflect.get(delegate, property, receiver) as unknown;
            },
          });

          await operation(transactionWithFailingAudit);
        }),
    };

    // Cet adaptateur expose uniquement la transaction utilisée par revokeOther.
    const serviceWithFailingAudit = new AuthSessionsService(
      transactionAdapter as unknown as PrismaService,
    );

    await expect(
      serviceWithFailingAudit.revokeOther(user, target.id, {
        ipAddress: "127.0.0.1",
        userAgent: "E2E rollback",
      }),
    ).rejects.toBe(auditFailure);

    expect(auditAttempted).toBe(true);
    expect(revocationObservedInsideTransaction).toBe(true);

    const afterFailure = await database.refreshSession.findUniqueOrThrow({
      where: { id: target.id },
    });

    expect(afterFailure.revokedAt).toBeNull();
    expect(afterFailure.lastUsedAt).toEqual(target.lastUsedAt);
    expect(afterFailure.expiresAt).toEqual(target.expiresAt);
    expect(afterFailure.tokenHash === target.tokenHash).toBe(true);
    expect(await database.auditLog.count({ where: auditWhere })).toBe(0);

    expect(
      (await request("/auth/me", "GET", undefined, other.accessToken)).status,
    ).toBe(200);

    // Nouvelle tentative via HTTP avec le service normal.
    const retry = await request(
      `/auth/sessions/${target.id}`,
      "DELETE",
      undefined,
      owner.accessToken,
    );

    expect(retry.status).toBe(204);

    const afterSuccess = await database.refreshSession.findUniqueOrThrow({
      where: { id: target.id },
    });

    expect(afterSuccess.revokedAt).not.toBeNull();
    expect(await database.auditLog.count({ where: auditWhere })).toBe(1);

    expect(
      (await request("/auth/me", "GET", undefined, other.accessToken)).status,
    ).toBe(401);

    expect((await request("/auth/refresh", "POST", otherCookie)).status).toBe(
      401,
    );

    expect(
      (await request("/auth/me", "GET", undefined, owner.accessToken)).status,
    ).toBe(200);
  });
});
