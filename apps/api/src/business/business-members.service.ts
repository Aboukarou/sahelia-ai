import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MembershipRole, Prisma, UserRole } from "@sahelia/database";
import type { RequestUser } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { ListMembersDto } from "./dto/list-members.dto";

const memberSelect = {
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
} satisfies Prisma.MembershipSelect;

@Injectable()
export class BusinessMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCurrent(user: RequestUser, query: ListMembersDto) {
    const businessId = user.businessId;

    if (!businessId) {
      throw new BadRequestException("Aucune entreprise sélectionnée.");
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const business = await transaction.business.findUnique({
          where: { id: businessId },
          select: { id: true, isActive: true },
        });

        if (!business) {
          throw new NotFoundException("Entreprise introuvable.");
        }

        if (!business.isActive) {
          throw new ForbiddenException("Cette entreprise est désactivée.");
        }

        if (user.role !== UserRole.SUPER_ADMIN) {
          const membership = await transaction.membership.findUnique({
            where: {
              userId_businessId: {
                userId: user.userId,
                businessId,
              },
            },
            select: { role: true, isActive: true },
          });

          if (
            !membership?.isActive ||
            (membership.role !== MembershipRole.OWNER &&
              membership.role !== MembershipRole.ADMIN)
          ) {
            throw new ForbiddenException(
              "Seuls le propriétaire et les administrateurs peuvent consulter les membres.",
            );
          }
        }

        const where = { businessId } satisfies Prisma.MembershipWhereInput;

        const total = await transaction.membership.count({ where });

        const items = await transaction.membership.findMany({
          where,
          select: memberSelect,
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });

        return {
          items,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );
  }
}
