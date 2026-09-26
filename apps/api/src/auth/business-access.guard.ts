import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { UserRole } from "@sahelia/database";
import type { Request } from "express";
import { PrismaService } from "../database/prisma.service";
import type { RequestUser } from "./auth.types";

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException("Authentification requise.");

    const headerBusinessId = request.header("x-business-id");
    const rawParameterBusinessId = request.params.businessId;
    const parameterBusinessId = Array.isArray(rawParameterBusinessId)
      ? rawParameterBusinessId[0]
      : rawParameterBusinessId;
    const businessId =
      parameterBusinessId ?? headerBusinessId ?? user.businessId;
    if (!businessId) {
      throw new BadRequestException("L’entreprise ciblée est obligatoire.");
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.membership.findUnique({
        where: { userId_businessId: { userId: user.userId, businessId } },
        select: {
          isActive: true,
          role: true,
          business: { select: { isActive: true } },
        },
      });
      if (!membership?.isActive || !membership.business.isActive) {
        throw new ForbiddenException("Accès interdit à cette entreprise.");
      }
      user.membershipRole = membership.role;
    }

    user.businessId = businessId;
    return true;
  }
}
