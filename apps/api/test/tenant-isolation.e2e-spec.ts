import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import { AppModule } from "../src/app.module";
import type { AuthProfile } from "../src/auth/auth.types";
import { PrismaService } from "../src/database/prisma.service";

interface AuthResponse {
  accessToken: string;
  profile: AuthProfile;
}

interface TestAccount extends AuthResponse {
  cookie: string;
}

interface BusinessResponse {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
}

interface MemberResponse {
  role: string;
  isActive: boolean;
  user: {
    id: string;
    isActive: boolean;
  };
}

interface SessionResponse {
  id: string;
  businessId: string | null;
  isCurrent: boolean;
}

interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

describe("Isolation HTTP entre comptes et entreprises", () => {
  const runId = randomUUID();
  const emails = [`e2e.a.${runId}@example.com`, `e2e.b.${runId}@example.com`];
  const businessNames = [
    `E2E entreprise A ${runId}`,
    `E2E entreprise B ${runId}`,
  ];

  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let databaseVerified = false;
  let baseUrl = "";
  let accountA: TestAccount;
  let accountB: TestAccount;

  async function request(
    path: string,
    account?: TestAccount,
    method = "GET",
    body?: Record<string, string>,
    cookie?: string,
  ): Promise<Response> {
    const headers: Record<string, string> = {};

    if (account) {
      headers.Authorization = `Bearer ${account.accessToken}`;
    }
    if (body) {
      headers["Content-Type"] = "application/json";
    }
    if (cookie) {
      headers.Cookie = cookie;
    }

    return fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
  }

  async function read<T>(path: string, account: TestAccount): Promise<T> {
    const response = await request(path, account);
    expect(response.status).toBe(200);
    return (await response.json()) as T;
  }

  async function register(index: number): Promise<TestAccount> {
    const response = await request("/auth/register", undefined, "POST", {
      email: emails[index]!,
      password: randomUUID(),
      name: `Utilisateur E2E ${index === 0 ? "A" : "B"}`,
      businessName: businessNames[index]!,
    });

    expect(response.status).toBe(201);

    const result = (await response.json()) as AuthResponse;
    expect(result.profile.business?.membershipRole).toBe("OWNER");
    expect(result.accessToken).toEqual(expect.any(String));

    const cookieHeader = response.headers
      .getSetCookie()
      .find((value) => value.startsWith("sahelia_e2e_refresh="));

    expect(cookieHeader).toBeDefined();

    const cookie = cookieHeader?.split(";")[0];
    if (!cookie) {
      throw new Error("Cookie de session absent à l'inscription.");
    }

    return { ...result, cookie };
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

    accountA = await register(0);
    accountB = await register(1);
  }, 60000);

  afterAll(async () => {
    try {
      if (prisma && databaseVerified) {
        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: {
            id: true,
            memberships: {
              select: { businessId: true },
            },
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
  }, 30000);

  it("retourne l'entreprise propre à chaque compte", async () => {
    const businessA = await read<BusinessResponse>(
      "/business/current",
      accountA,
    );
    const businessB = await read<BusinessResponse>(
      "/business/current",
      accountB,
    );

    expect(accountA.profile.id).not.toBe(accountB.profile.id);
    expect(businessA.id).toBe(accountA.profile.business?.id);
    expect(businessB.id).toBe(accountB.profile.business?.id);
    expect(businessA.id).not.toBe(businessB.id);
  });

  it("retourne uniquement le membre de chaque entreprise", async () => {
    for (const account of [accountA, accountB]) {
      const result = await read<Paginated<MemberResponse>>(
        "/business/current/members?page=1&limit=20",
        account,
      );

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        role: "OWNER",
        isActive: true,
        user: {
          id: account.profile.id,
          isActive: true,
        },
      });
    }
  });

  it("modifie A sans modifier l'entreprise B", async () => {
    const beforeA = await read<BusinessResponse>("/business/current", accountA);
    const beforeB = await read<BusinessResponse>("/business/current", accountB);
    const name = `E2E entreprise A modifiee ${runId}`;

    const response = await request("/business/current", accountA, "PATCH", {
      name,
    });
    expect(response.status).toBe(200);

    const afterA = await read<BusinessResponse>("/business/current", accountA);
    const afterB = await read<BusinessResponse>("/business/current", accountB);

    expect(afterA).toMatchObject({
      id: beforeA.id,
      name,
      slug: beforeA.slug,
    });
    expect(afterB).toEqual(beforeB);
  });

  it("sépare les listes de sessions et identifie la session courante", async () => {
    const sessionsA = await read<Paginated<SessionResponse>>(
      "/auth/sessions?page=1&limit=20",
      accountA,
    );
    const sessionsB = await read<Paginated<SessionResponse>>(
      "/auth/sessions?page=1&limit=20",
      accountB,
    );

    for (const [account, sessions] of [
      [accountA, sessionsA],
      [accountB, sessionsB],
    ] as const) {
      expect(sessions.items).toHaveLength(1);
      expect(sessions.pagination.total).toBe(1);
      expect(sessions.items[0]).toMatchObject({
        businessId: account.profile.business?.id,
        isCurrent: true,
      });
    }

    expect(sessionsA.items[0]?.id).not.toBe(sessionsB.items[0]?.id);
  });

  it.each(["A vers B", "B vers A"])(
    "refuse la révocation croisée : %s",
    async (direction) => {
      const actor = direction === "A vers B" ? accountA : accountB;
      const target = direction === "A vers B" ? accountB : accountA;

      const before = await read<Paginated<SessionResponse>>(
        "/auth/sessions?page=1&limit=20",
        target,
      );
      const sessionId = before.items[0]?.id;
      expect(sessionId).toBeDefined();

      const response = await request(
        `/auth/sessions/${encodeURIComponent(sessionId!)}`,
        actor,
        "DELETE",
      );
      expect(response.status).toBe(404);

      const profile = await read<AuthProfile>("/auth/me", target);
      expect(profile.id).toBe(target.profile.id);

      const after = await read<Paginated<SessionResponse>>(
        "/auth/sessions?page=1&limit=20",
        target,
      );
      expect(after.items).toEqual(before.items);
    },
  );

  it("déconnecte les comptes et refuse ensuite leurs tokens", async () => {
    for (const account of [accountA, accountB]) {
      const logout = await request(
        "/auth/logout",
        undefined,
        "POST",
        undefined,
        account.cookie,
      );
      expect(logout.status).toBe(204);

      const profile = await request("/auth/me", account);
      expect(profile.status).toBe(401);

      const refresh = await request(
        "/auth/refresh",
        undefined,
        "POST",
        undefined,
        account.cookie,
      );
      expect(refresh.status).toBe(401);
    }
  });
});
