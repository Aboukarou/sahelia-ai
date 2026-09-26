import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { MembershipRole, UserRole } from "@sahelia/database";
import type { Request } from "express";
import type { PrismaService } from "../database/prisma.service";
import type { RequestUser } from "./auth.types";
import { BusinessAccessGuard } from "./business-access.guard";

describe("BusinessAccessGuard", () => {
  const membershipFindUnique = jest.fn();
  const prisma = {
    membership: { findUnique: membershipFindUnique },
  } as unknown as PrismaService;
  const guard = new BusinessAccessGuard(prisma);

  function context(user: RequestUser, businessId: string): ExecutionContext {
    const request = {
      user,
      params: {},
      header: jest.fn().mockReturnValue(businessId),
    } as unknown as Request & { user: RequestUser };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  function user(role: UserRole = UserRole.CLIENT): RequestUser {
    return {
      userId: "user-1",
      email: "client@sahelia.ai",
      role,
      businessId: "business-1",
      membershipRole: MembershipRole.OWNER,
      sessionId: "session-1",
    };
  }

  beforeEach(() => membershipFindUnique.mockReset());

  it("refuse un client sans membership dans l’entreprise ciblée", async () => {
    membershipFindUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(context(user(), "business-2")),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("autorise uniquement un membership et une entreprise actifs", async () => {
    membershipFindUnique.mockResolvedValue({
      isActive: true,
      role: MembershipRole.ADMIN,
      business: { isActive: true },
    });
    await expect(
      guard.canActivate(context(user(), "business-2")),
    ).resolves.toBe(true);
  });

  it("permet au SUPER_ADMIN de cibler une entreprise sans membership", async () => {
    await expect(
      guard.canActivate(context(user(UserRole.SUPER_ADMIN), "business-2")),
    ).resolves.toBe(true);
    expect(membershipFindUnique).not.toHaveBeenCalled();
  });
});
