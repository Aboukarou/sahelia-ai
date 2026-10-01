import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@sahelia/database";
import { PrismaService } from "../database/prisma.service";
import type { RequestMetadata, RequestUser } from "./auth.types";
import { ListSessionsDto } from "./dto/list-sessions.dto";

const sessionSelect = {
  id: true,
  businessId: true,
  userAgent: true,
  ipAddress: true,
  createdAt: true,
  lastUsedAt: true,
  expiresAt: true,
} satisfies Prisma.RefreshSessionSelect;

@Injectable()
export class AuthSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(user: RequestUser, query: ListSessionsDto) {
    const now = new Date();

    const where = {
      userId: user.userId,
      revokedAt: null,
      expiresAt: { gt: now },
    } satisfies Prisma.RefreshSessionWhereInput;

    return this.prisma.$transaction(
      async (transaction) => {
        const total = await transaction.refreshSession.count({ where });

        const sessions = await transaction.refreshSession.findMany({
          where,
          select: sessionSelect,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });

        return {
          items: sessions.map((session) => ({
            ...session,
            isCurrent: session.id === user.sessionId,
          })),
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

  async revokeOther(
    user: RequestUser,
    sessionId: string,
    metadata: RequestMetadata,
  ): Promise<void> {
    if (sessionId === user.sessionId) {
      throw new BadRequestException(
        "Utilisez la déconnexion pour fermer la session de cet appareil.",
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const session = await transaction.refreshSession.findFirst({
        where: {
          id: sessionId,
          userId: user.userId,
        },
        select: {
          id: true,
          businessId: true,
          revokedAt: true,
          expiresAt: true,
        },
      });

      if (!session) {
        throw new NotFoundException("Session introuvable.");
      }

      const now = new Date();

      // Une session déjà fermée ne nécessite aucune nouvelle écriture.
      if (session.revokedAt !== null || session.expiresAt <= now) {
        return;
      }

      const result = await transaction.refreshSession.updateMany({
        where: {
          id: session.id,
          userId: user.userId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          revokedAt: now,
        },
      });

      // Une autre requête peut avoir révoqué la session entre-temps.
      if (result.count === 0) {
        return;
      }

      await transaction.auditLog.create({
        data: {
          action: "AUTH_SESSION_REVOKED",
          actorId: user.userId,
          businessId: session.businessId,
          entityType: "RefreshSession",
          entityId: session.id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      });
    });
  }
}