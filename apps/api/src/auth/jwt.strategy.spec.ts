import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MembershipRole, UserRole } from "@sahelia/database";
import type { PrismaService } from "../database/prisma.service";
import type { RequestUser } from "./auth.types";
import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  const sessionFindUnique = jest.fn();
  const userFindUnique = jest.fn();
  const membershipFindUnique = jest.fn();

  const prisma = {
    refreshSession: {
      findUnique: sessionFindUnique,
    },
    user: {
      findUnique: userFindUnique,
    },
    membership: {
      findUnique: membershipFindUnique,
    },
  } as unknown as PrismaService;

  const config = new ConfigService({
    JWT_ACCESS_SECRET: "test-secret-for-jwt-strategy-at-least-32-characters",
  });

  const strategy = new JwtStrategy(config, prisma);

  const payload: RequestUser = {
    userId: "user-1",
    email: "old@example.com",
    role: UserRole.CLIENT,
    businessId: "business-1",
    membershipRole: MembershipRole.OWNER,
    sessionId: "session-1",
  };

  const now = new Date("2026-10-01T12:00:00Z");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    sessionFindUnique.mockResolvedValue({
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date("2026-10-02T12:00:00Z"),
    });

    userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "current@example.com",
      role: UserRole.CLIENT,
      isActive: true,
    });

    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.OWNER,
      isActive: true,
      business: { isActive: true },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("autorise une session active et utilise les informations actuelles", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "current@example.com",
      role: UserRole.ADMIN,
      isActive: true,
    });

    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.ADMIN,
      isActive: true,
      business: { isActive: true },
    });

    await expect(strategy.validate(payload)).resolves.toEqual({
      ...payload,
      email: "current@example.com",
      role: UserRole.ADMIN,
      membershipRole: MembershipRole.ADMIN,
    });

    expect(sessionFindUnique).toHaveBeenCalledWith({
      where: { id: "session-1" },
      select: {
        userId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });
  });

  it.each([
    ["identifiant utilisateur vide", { ...payload, userId: "" }],
    ["identifiant session vide", { ...payload, sessionId: "" }],
    ["identifiant entreprise vide", { ...payload, businessId: "" }],
  ])("refuse un payload avec %s", async (_label, invalidPayload) => {
    await expect(strategy.validate(invalidPayload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(sessionFindUnique).not.toHaveBeenCalled();
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(membershipFindUnique).not.toHaveBeenCalled();
  });

  it("refuse une session introuvable", async () => {
    sessionFindUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(userFindUnique).not.toHaveBeenCalled();
    expect(membershipFindUnique).not.toHaveBeenCalled();
  });

  it("refuse une session appartenant à un autre utilisateur", async () => {
    sessionFindUnique.mockResolvedValue({
      userId: "user-2",
      revokedAt: null,
      expiresAt: new Date("2026-10-02T12:00:00Z"),
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(userFindUnique).not.toHaveBeenCalled();
    expect(membershipFindUnique).not.toHaveBeenCalled();
  });

  it("refuse une session révoquée même si le token est encore valide", async () => {
    sessionFindUnique.mockResolvedValue({
      userId: "user-1",
      revokedAt: new Date("2026-10-01T11:59:00Z"),
      expiresAt: new Date("2026-10-02T12:00:00Z"),
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(userFindUnique).not.toHaveBeenCalled();
    expect(membershipFindUnique).not.toHaveBeenCalled();
  });

  it.each([new Date("2026-10-01T11:59:59Z"), new Date("2026-10-01T12:00:00Z")])(
    "refuse une session expirée à %s",
    async (expiresAt) => {
      sessionFindUnique.mockResolvedValue({
        userId: "user-1",
        revokedAt: null,
        expiresAt,
      });

      await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(userFindUnique).not.toHaveBeenCalled();
      expect(membershipFindUnique).not.toHaveBeenCalled();
    },
  );

  it("refuse un utilisateur introuvable", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(membershipFindUnique).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur désactivé", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "current@example.com",
      role: UserRole.CLIENT,
      isActive: false,
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(membershipFindUnique).not.toHaveBeenCalled();
  });

  it("refuse une adhésion introuvable", async () => {
    membershipFindUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("refuse une adhésion désactivée", async () => {
    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.OWNER,
      isActive: false,
      business: { isActive: true },
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("refuse une entreprise désactivée", async () => {
    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.OWNER,
      isActive: true,
      business: { isActive: false },
    });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("vérifie l’adhésion pour l’utilisateur et l’entreprise du token", async () => {
    await strategy.validate(payload);

    expect(membershipFindUnique).toHaveBeenCalledWith({
      where: {
        userId_businessId: {
          userId: "user-1",
          businessId: "business-1",
        },
      },
      include: {
        business: {
          select: { isActive: true },
        },
      },
    });
  });

  it("autorise une session sans entreprise et retire le rôle d’adhésion", async () => {
    await expect(
      strategy.validate({
        ...payload,
        businessId: null,
        membershipRole: MembershipRole.OWNER,
      }),
    ).resolves.toEqual({
      ...payload,
      email: "current@example.com",
      businessId: null,
      membershipRole: null,
    });

    expect(membershipFindUnique).not.toHaveBeenCalled();
  });
});
