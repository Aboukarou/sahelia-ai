import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { MembershipRole, Prisma, UserRole } from "@sahelia/database";
import type { RequestUser } from "../auth/auth.types";
import type { PrismaService } from "../database/prisma.service";
import { BusinessMembersService } from "./business-members.service";
import { ListMembersDto } from "./dto/list-members.dto";

describe("BusinessMembersService", () => {
  const businessFindUnique = jest.fn();
  const membershipFindUnique = jest.fn();
  const membershipCount = jest.fn();
  const membershipFindMany = jest.fn();

  const transaction = {
    business: {
      findUnique: businessFindUnique,
    },
    membership: {
      findUnique: membershipFindUnique,
      count: membershipCount,
      findMany: membershipFindMany,
    },
  };

  const runTransaction = jest.fn(
    (callback: (client: Prisma.TransactionClient) => Promise<unknown>) =>
      callback(transaction as unknown as Prisma.TransactionClient),
  );

  const prisma = {
    $transaction: runTransaction,
  } as unknown as PrismaService;

  const service = new BusinessMembersService(prisma);

  const user: RequestUser = {
    userId: "user-1",
    email: "owner@example.com",
    role: UserRole.CLIENT,
    businessId: "business-1",
    membershipRole: MembershipRole.OWNER,
    sessionId: "session-1",
  };

  const member = {
    id: "membership-1",
    role: MembershipRole.OWNER,
    isActive: true,
    createdAt: new Date("2026-09-30T00:00:00Z"),
    user: {
      id: "user-1",
      name: "Boukar Abba",
      email: "owner@example.com",
      isActive: true,
    },
  };

  function query(page = 1, limit = 20): ListMembersDto {
    const dto = new ListMembersDto();
    dto.page = page;
    dto.limit = limit;
    return dto;
  }

  function expectNoMemberRead() {
    expect(membershipCount).not.toHaveBeenCalled();
    expect(membershipFindMany).not.toHaveBeenCalled();
  }

  beforeEach(() => {
    jest.clearAllMocks();

    businessFindUnique.mockResolvedValue({
      id: "business-1",
      isActive: true,
    });

    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.OWNER,
      isActive: true,
    });

    membershipCount.mockResolvedValue(1);
    membershipFindMany.mockResolvedValue([member]);
  });

  it("refuse la consultation sans entreprise sélectionnée", async () => {
    await expect(
      service.listCurrent({ ...user, businessId: null }, query()),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(runTransaction).not.toHaveBeenCalled();
    expectNoMemberRead();
  });

  it("refuse la consultation d’une entreprise introuvable", async () => {
    businessFindUnique.mockResolvedValue(null);

    await expect(service.listCurrent(user, query())).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(membershipFindUnique).not.toHaveBeenCalled();
    expectNoMemberRead();
  });

  it("refuse la consultation d’une entreprise désactivée", async () => {
    businessFindUnique.mockResolvedValue({
      id: "business-1",
      isActive: false,
    });

    await expect(service.listCurrent(user, query())).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(membershipFindUnique).not.toHaveBeenCalled();
    expectNoMemberRead();
  });

  it("refuse un utilisateur sans adhésion", async () => {
    membershipFindUnique.mockResolvedValue(null);

    await expect(service.listCurrent(user, query())).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expectNoMemberRead();
  });

  it("refuse une adhésion désactivée même pour un propriétaire", async () => {
    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.OWNER,
      isActive: false,
    });

    await expect(service.listCurrent(user, query())).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expectNoMemberRead();
  });

  it("refuse un membre malgré le rôle propriétaire présent dans le token", async () => {
    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.MEMBER,
      isActive: true,
    });

    await expect(service.listCurrent(user, query())).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expectNoMemberRead();
  });

  it.each([MembershipRole.OWNER, MembershipRole.ADMIN])(
    "autorise une adhésion active avec le rôle %s",
    async (role) => {
      membershipFindUnique.mockResolvedValue({
        role,
        isActive: true,
      });

      await expect(service.listCurrent(user, query())).resolves.toEqual({
        items: [member],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      expect(membershipFindUnique).toHaveBeenCalledWith({
        where: {
          userId_businessId: {
            userId: "user-1",
            businessId: "business-1",
          },
        },
        select: {
          role: true,
          isActive: true,
        },
      });
    },
  );

  it("ne donne pas d’accès au rôle ADMIN du compte sans adhésion autorisée", async () => {
    membershipFindUnique.mockResolvedValue({
      role: MembershipRole.MEMBER,
      isActive: true,
    });

    await expect(
      service.listCurrent({ ...user, role: UserRole.ADMIN }, query()),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expectNoMemberRead();
  });

  it("autorise le super administrateur sans rechercher son adhésion", async () => {
    membershipFindUnique.mockResolvedValue(null);

    await expect(
      service.listCurrent({ ...user, role: UserRole.SUPER_ADMIN }, query()),
    ).resolves.toMatchObject({
      items: [member],
      pagination: { total: 1 },
    });

    expect(membershipFindUnique).not.toHaveBeenCalled();
    expect(membershipCount).toHaveBeenCalledWith({
      where: { businessId: "business-1" },
    });
  });

  it("refuse aussi une entreprise désactivée au super administrateur", async () => {
    businessFindUnique.mockResolvedValue({
      id: "business-1",
      isActive: false,
    });

    await expect(
      service.listCurrent({ ...user, role: UserRole.SUPER_ADMIN }, query()),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expectNoMemberRead();
  });

  it("limite les lectures à l’entreprise sélectionnée et calcule la pagination", async () => {
    membershipCount.mockResolvedValue(45);

    await expect(service.listCurrent(user, query(2, 20))).resolves.toEqual({
      items: [member],
      pagination: {
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
      },
    });

    expect(businessFindUnique).toHaveBeenCalledWith({
      where: { id: "business-1" },
      select: { id: true, isActive: true },
    });

    expect(membershipCount).toHaveBeenCalledWith({
      where: { businessId: "business-1" },
    });

    expect(membershipFindMany).toHaveBeenCalledWith({
      where: { businessId: "business-1" },
      select: {
        id: true,
        role: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: 20,
      take: 20,
    });

    expect(runTransaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
  });

  it("retourne zéro page lorsque l’entreprise ne contient aucun membre", async () => {
    membershipCount.mockResolvedValue(0);
    membershipFindMany.mockResolvedValue([]);

    await expect(service.listCurrent(user, query())).resolves.toEqual({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("retourne une liste vide pour une page au-delà de la dernière", async () => {
    membershipCount.mockResolvedValue(1);
    membershipFindMany.mockResolvedValue([]);

    await expect(service.listCurrent(user, query(2, 20))).resolves.toEqual({
      items: [],
      pagination: {
        page: 2,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it("conserve les statuts inactifs dans les résultats", async () => {
    const inactiveMember = {
      ...member,
      isActive: false,
      user: {
        ...member.user,
        isActive: false,
      },
    };

    membershipFindMany.mockResolvedValue([inactiveMember]);

    await expect(service.listCurrent(user, query())).resolves.toMatchObject({
      items: [
        {
          isActive: false,
          user: { isActive: false },
        },
      ],
    });
  });
});
