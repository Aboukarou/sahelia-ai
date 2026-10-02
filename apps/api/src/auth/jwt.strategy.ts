import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../database/prisma.service";
import type { RequestUser } from "./auth.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: RequestUser): Promise<RequestUser> {
    if (
      !payload ||
      typeof payload.userId !== "string" ||
      payload.userId.length === 0 ||
      typeof payload.sessionId !== "string" ||
      payload.sessionId.length === 0 ||
      (payload.businessId !== null &&
        (typeof payload.businessId !== "string" ||
          payload.businessId.length === 0))
    ) {
      throw new UnauthorizedException("Session utilisateur invalide.");
    }

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sessionId },
      select: {
        userId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (
      !session ||
      session.userId !== payload.userId ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException("Session invalide ou expirée.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException("Session utilisateur invalide.");
    }

    let membershipRole: RequestUser["membershipRole"] = null;

    if (payload.businessId) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_businessId: {
            userId: payload.userId,
            businessId: payload.businessId,
          },
        },
        include: {
          business: {
            select: { isActive: true },
          },
        },
      });

      if (!membership?.isActive || !membership.business.isActive) {
        throw new UnauthorizedException("Accès à l’entreprise révoqué.");
      }

      membershipRole = membership.role;
    }

    return {
      ...payload,
      email: user.email,
      role: user.role,
      membershipRole,
    };
  }
}
