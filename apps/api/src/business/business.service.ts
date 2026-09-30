import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MembershipRole, Prisma, UserRole } from "@sahelia/database";
import type { RequestMetadata, RequestUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { UpdateBusinessDto } from "./dto/update-business.dto";

const businessSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BusinessSelect;

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent(user: RequestUser) {
    const businessId = this.requireBusinessId(user);

    return this.prisma.$transaction(async (transaction) => {
      const membershipRole = await this.checkAccess(
        transaction,
        user,
        businessId,
        false,
      );

      const business = await transaction.business.findUnique({
        where: { id: businessId },
        select: businessSelect,
      });

      if (!business) {
        throw new NotFoundException("Entreprise introuvable.");
      }

      if (!business.isActive) {
        throw new ForbiddenException("Cette entreprise est désactivée.");
      }

      return {
        ...business,
        membershipRole,
        canEdit:
          user.role === UserRole.SUPER_ADMIN ||
          membershipRole === MembershipRole.OWNER ||
          membershipRole === MembershipRole.ADMIN,
      };
    });
  }

  async updateCurrent(
    user: RequestUser,
    dto: UpdateBusinessDto,
    metadata: RequestMetadata,
  ) {
    const businessId = this.requireBusinessId(user);
    const name = dto.name.trim();

    if (name.length < 2 || name.length > 120) {
      throw new BadRequestException(
        "Le nom doit contenir entre 2 et 120 caractères.",
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const membershipRole = await this.checkAccess(
        transaction,
        user,
        businessId,
        true,
      );

      const existing = await transaction.business.findUnique({
        where: { id: businessId },
        select: businessSelect,
      });

      if (!existing) {
        throw new NotFoundException("Entreprise introuvable.");
      }

      if (!existing.isActive) {
        throw new ForbiddenException("Cette entreprise est désactivée.");
      }

      if (existing.name === name) {
        return { ...existing, membershipRole, canEdit: true };
      }

      const business = await transaction.business.update({
        where: { id: businessId },
        data: { name },
        select: businessSelect,
      });

      await transaction.auditLog.create({
        data: {
          action: "BUSINESS_UPDATED",
          actorId: user.userId,
          businessId,
          entityType: "Business",
          entityId: businessId,
          metadata: {
            before: { name: existing.name },
            after: { name: business.name },
          },
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      });

      return { ...business, membershipRole, canEdit: true };
    });
  }

  private requireBusinessId(user: RequestUser): string {
    if (!user.businessId) {
      throw new BadRequestException("Aucune entreprise sélectionnée.");
    }

    return user.businessId;
  }

  private async checkAccess(
    transaction: Prisma.TransactionClient,
    user: RequestUser,
    businessId: string,
    editing: boolean,
  ): Promise<MembershipRole | null> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return null;
    }

    const membership = await transaction.membership.findUnique({
      where: {
        userId_businessId: {
          userId: user.userId,
          businessId,
        },
      },
      select: {
        role: true,
        isActive: true,
        business: { select: { isActive: true } },
      },
    });

    if (!membership?.isActive || !membership.business.isActive) {
      throw new ForbiddenException("Accès interdit à cette entreprise.");
    }

    if (
      editing &&
      membership.role !== MembershipRole.OWNER &&
      membership.role !== MembershipRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Seuls le propriétaire et les administrateurs peuvent modifier l’entreprise.",
      );
    }

    return membership.role;
  }
}
