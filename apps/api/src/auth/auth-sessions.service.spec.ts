import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { MembershipRole, Prisma, UserRole } from "@sahelia/database";
import type { PrismaService } from "../database/prisma.service";
import { AuthSessionsService } from "./auth-sessions.service";
import type { RequestMetadata, RequestUser } from "./auth.types";
import { ListSessionsDto } from "./dto/list-sessions.dto";

describe("AuthSessionsService", () => {
  const sessionCount = jest.fn();
  const sessionFindMany = jest.fn();
  const sessionFindFirst = jest.fn();
  const sessionUpdateMany = jest.fn();
  const auditCreate = jest.fn();

  const transaction = {
    refreshSession: {
      count: sessionCount,
      findMany: sessionFindMany,
      findFirst: sessionFindFirst,
      updateMany: sessionUpdateMany,
    },
    auditLog: {
      create: auditCreate,
    },
  };

  const runTransaction = jest.fn(
    (callback: (client: Prisma.TransactionClient) => Promise<unknown>) =>
      callback(transaction as unknown as Prisma.TransactionClient),
  );

  const prisma = {
    $transaction: runTransaction,
  } as unknown as PrismaService;

  const service = new AuthSessionsService(prisma);

  const now = new Date("2026-10-01T12:00:00Z");
  const expiresAt = new Date("2026-10-02T12:00:00Z");

  const user: RequestUser = {
    userId: "user-1",
    email: "owner@example.com",
    role: UserRole.CLIENT,
    businessId: "business-1",
    membershipRole: MembershipRole.OWNER,
    sessionId: "session-current",
  };

  const metadata: RequestMetadata = {
    ipAddress: "127.0.0.1",
    userAgent: "test-browser",
  };

  const currentSession = {
    id: "session-current",
    businessId: "business-1",
    userAgent: "current-browser",
    ipAddress: "127.0.0.1",
    createdAt: new Date("2026-10-01T10:00:00Z"),
    lastUsedAt: new Date("2026-10-01T11:00:00Z"),
    expiresAt,
  };

  const otherSession = {
    ...currentSession,
    id: "session-other",
    businessId: "business-2",
    userAgent: "other-browser",
  };

  function query(page = 1, limit = 20): ListSessionsDto {
    const dto = new ListSessionsDto();
    dto.page = page;
    dto.limit = limit;
    return dto;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    sessionCount.mockResolvedValue(2);
    sessionFindMany.mockResolvedValue([currentSession, otherSession]);

    sessionFindFirst.mockResolvedValue({
      id: "session-other",
      businessId: "business-2",
      revokedAt: null,
      expiresAt,
    });

    sessionUpdateMany.mockResolvedValue({ count: 1 });
    auditCreate.mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("liste les sessions du compte et identifie la session courante", async () => {
    await expect(service.listMine(user, query())).resolves.toEqual({
      items: [
        { ...currentSession, isCurrent: true },
        { ...otherSession, isCurrent: false },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });

    expect(sessionCount).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    expect(sessionFindMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        businessId: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 0,
      take: 20,
    });

    expect(runTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  });

  it("calcule la pagination de la deuxième page", async () => {
    sessionCount.mockResolvedValue(45);
    sessionFindMany.mockResolvedValue([otherSession]);

    await expect(service.listMine(user, query(2, 20))).resolves.toEqual({
      items: [{ ...otherSession, isCurrent: false }],
      pagination: {
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      },
    });

    expect(sessionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      }),
    );
  });

  it("retourne zéro page lorsque le compte n’a aucune session active", async () => {
    sessionCount.mockResolvedValue(0);
    sessionFindMany.mockResolvedValue([]);

    await expect(service.listMine(user, query())).resolves.toEqual({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("retourne une liste vide au-delà de la dernière page", async () => {
    sessionCount.mockResolvedValue(2);
    sessionFindMany.mockResolvedValue([]);

    await expect(service.listMine(user, query(2, 20))).resolves.toEqual({
      items: [],
      pagination: {
        page: 2,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it("conserve le filtre utilisateur pour un super administrateur", async () => {
    await service.listMine(
      { ...user, role: UserRole.SUPER_ADMIN },
      query(),
    );

    expect(sessionCount).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });
  });

  it("refuse de révoquer la session courante", async () => {
    await expect(
      service.revokeOther(user, user.sessionId, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(runTransaction).not.toHaveBeenCalled();
    expect(sessionUpdateMany).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("retourne 404 pour une session absente du compte", async () => {
    sessionFindFirst.mockResolvedValue(null);

    await expect(
      service.revokeOther(user, "session-foreign", metadata),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(sessionFindFirst).toHaveBeenCalledWith({
      where: {
        id: "session-foreign",
        userId: "user-1",
      },
      select: {
        id: true,
        businessId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    expect(sessionUpdateMany).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("n’accorde pas de révocation sur autrui au super administrateur", async () => {
    sessionFindFirst.mockResolvedValue(null);

    await expect(
      service.revokeOther(
        { ...user, role: UserRole.SUPER_ADMIN },
        "session-foreign",
        metadata,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(sessionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "session-foreign",
          userId: "user-1",
        },
      }),
    );

    expect(sessionUpdateMany).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("révoque une autre session du compte et journalise son entreprise", async () => {
    await expect(
      service.revokeOther(user, "session-other", metadata),
    ).resolves.toBeUndefined();

    expect(sessionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "session-other",
        userId: "user-1",
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        revokedAt: now,
      },
    });

    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        action: "AUTH_SESSION_REVOKED",
        actorId: "user-1",
        businessId: "business-2",
        entityType: "RefreshSession",
        entityId: "session-other",
        ipAddress: "127.0.0.1",
        userAgent: "test-browser",
      },
    });

    expect(runTransaction).toHaveBeenCalledTimes(1);
  });

  it("ne réécrit pas une session déjà révoquée", async () => {
    sessionFindFirst.mockResolvedValue({
      id: "session-other",
      businessId: "business-2",
      revokedAt: new Date("2026-10-01T11:00:00Z"),
      expiresAt,
    });

    await expect(
      service.revokeOther(user, "session-other", metadata),
    ).resolves.toBeUndefined();

    expect(sessionUpdateMany).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it.each([
    new Date("2026-10-01T11:59:59Z"),
    new Date("2026-10-01T12:00:00Z"),
  ])("ne révoque pas une session expirée à %s", async (expiry) => {
    sessionFindFirst.mockResolvedValue({
      id: "session-other",
      businessId: "business-2",
      revokedAt: null,
      expiresAt: expiry,
    });

    await expect(
      service.revokeOther(user, "session-other", metadata),
    ).resolves.toBeUndefined();

    expect(sessionUpdateMany).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("ne crée pas de doublon d’audit si une autre requête a révoqué la session", async () => {
    sessionUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.revokeOther(user, "session-other", metadata),
    ).resolves.toBeUndefined();

    expect(sessionUpdateMany).toHaveBeenCalledTimes(1);
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("remonte une erreur d’audit à la transaction", async () => {
    const failure = new Error("Audit indisponible");
    auditCreate.mockRejectedValueOnce(failure);

    await expect(
      service.revokeOther(user, "session-other", metadata),
    ).rejects.toThrow(failure);

    expect(runTransaction).toHaveBeenCalledTimes(1);
  });
});