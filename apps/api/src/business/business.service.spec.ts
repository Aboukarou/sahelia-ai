import { ForbiddenException } from "@nestjs/common";
import { MembershipRole, Prisma, UserRole } from "@sahelia/database";
import type { RequestMetadata, RequestUser } from "../auth/auth.types";
import type { PrismaService } from "../database/prisma.service";
import { BusinessService } from "./business.service";

describe("BusinessService", () => {
  const membershipFindUnique = jest.fn();
  const businessFindUnique = jest.fn();
  const businessUpdate = jest.fn();
  const auditCreate = jest.fn();

  const transaction = {
    membership: { findUnique: membershipFindUnique },
    business: {
      findUnique: businessFindUnique,
      update: businessUpdate,
    },
    auditLog: { create: auditCreate },
  };

  const prisma = {
    $transaction: jest.fn(
      (callback: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        callback(transaction as unknown as Prisma.TransactionClient),
    ),
  } as unknown as PrismaService;

  const service = new BusinessService(prisma);

  const user: RequestUser = {
    userId: "user-1",
    email: "owner@example.com",
    role: UserRole.CLIENT,
    businessId: "business-1",
    membershipRole: MembershipRole.OWNER,
    sessionId: "session-1",
  };

  const metadata: RequestMetadata = {
    ipAddress: "127.0.0.1",
    userAgent: "test",
  };

  const business = {
    id: "business-1",
    name: "Entreprise initiale",
    slug: "entreprise-initiale",
    isActive: true,
    createdAt: new Date("2026-09-30T00:00:00Z"),
    updatedAt: new Date("2026-09-30T00:00:00Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.OWNER,
      isActive: true,
      business: { isActive: true },
    });

    businessFindUnique.mockResolvedValue(business);
    businessUpdate.mockResolvedValue({
      ...business,
      name: "Nouveau nom",
    });
    auditCreate.mockResolvedValue({});
  });

  it("refuse la consultation sans membership actif", async () => {
    membershipFindUnique.mockResolvedValue(null);

    await expect(service.findCurrent(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(businessFindUnique).not.toHaveBeenCalled();
  });

  it("autorise un membre à consulter mais pas à modifier", async () => {
    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.MEMBER,
      isActive: true,
      business: { isActive: true },
    });

    await expect(service.findCurrent(user)).resolves.toMatchObject({
      id: "business-1",
      canEdit: false,
    });

    await expect(
      service.updateCurrent(user, { name: "Nouveau nom" }, metadata),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(businessUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("refuse la modification d’une entreprise désactivée", async () => {
    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.OWNER,
      isActive: true,
      business: { isActive: false },
    });

    await expect(
      service.updateCurrent(user, { name: "Nouveau nom" }, metadata),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(businessUpdate).not.toHaveBeenCalled();
  });

  it("modifie le nom et enregistre les valeurs dans le journal d’audit", async () => {
    await expect(
      service.updateCurrent(user, { name: "Nouveau nom" }, metadata),
    ).resolves.toMatchObject({
      name: "Nouveau nom",
      canEdit: true,
    });

    expect(businessUpdate).toHaveBeenCalledTimes(1);
    expect(businessUpdate).toHaveBeenCalledWith({
      where: { id: "business-1" },
      data: { name: "Nouveau nom" },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        action: "BUSINESS_UPDATED",
        actorId: "user-1",
        businessId: "business-1",
        entityType: "Business",
        entityId: "business-1",
        metadata: {
          before: { name: "Entreprise initiale" },
          after: { name: "Nouveau nom" },
        },
        ipAddress: "127.0.0.1",
        userAgent: "test",
      },
    });
  });

  it("ne crée pas d’écriture lorsque le nom est inchangé", async () => {
    await service.updateCurrent(user, { name: business.name }, metadata);

    expect(businessUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });
});
