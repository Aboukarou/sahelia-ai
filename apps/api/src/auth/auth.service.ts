import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { MembershipRole, Prisma, UserRole, type User } from "@sahelia/database";
import { compare, hash } from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import type {
  AuthProfile,
  AuthResult,
  RequestMetadata,
  RequestUser,
} from "./auth.types";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

interface RefreshPayload {
  sub: string;
  sid: string;
  type: "refresh";
}

const userWithMembership = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    memberships: {
      where: { isActive: true, business: { isActive: true } },
      include: { business: true },
      orderBy: { createdAt: "asc" },
      take: 1,
    },
  },
});

type UserWithMembership = Prisma.UserGetPayload<typeof userWithMembership>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(
        "Un compte existe déjà avec cette adresse e-mail.",
      );
    }

    const passwordHash = await hash(dto.password, 12);
    const baseSlug = this.slugify(dto.businessName);

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const business = await transaction.business.create({
          data: {
            name: dto.businessName.trim(),
            slug: await this.availableSlug(transaction, baseSlug),
          },
        });
        const createdUser = await transaction.user.create({
          data: {
            email,
            name: dto.name.trim(),
            passwordHash,
            role: UserRole.CLIENT,
            memberships: {
              create: { businessId: business.id, role: MembershipRole.OWNER },
            },
          },
          ...userWithMembership,
        });
        await transaction.auditLog.create({
          data: {
            action: "AUTH_REGISTERED",
            actorId: createdUser.id,
            businessId: business.id,
            entityType: "User",
            entityId: createdUser.id,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          },
        });
        return createdUser;
      });

      return this.createSession(user, metadata);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Le compte ou l’entreprise existe déjà.");
      }
      throw error;
    }
  }

  async login(dto: LoginDto, metadata: RequestMetadata): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      ...userWithMembership,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Identifiants incorrects.");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        "Compte temporairement verrouillé. Réessayez plus tard.",
      );
    }

    if (!(await compare(dto.password, user.passwordHash))) {
      await this.recordFailedLogin(user, metadata);
      throw new UnauthorizedException("Identifiants incorrects.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.writeAudit("AUTH_LOGIN_SUCCEEDED", user, metadata);
    return this.createSession(user, metadata);
  }

  async refresh(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sid },
      include: { user: { ...userWithMembership } },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.tokenHash !== this.hashToken(refreshToken) ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException("Session invalide ou expirée.");
    }

    const result = await this.issueTokens(session.user, session.id);
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        tokenHash: this.hashToken(result.refreshToken),
        lastUsedAt: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
    return {
      ...result,
      refreshExpiresAt: session.expiresAt,
      profile: this.toProfile(session.user),
    };
  }

  async logout(
    refreshToken: string | undefined,
    metadata: RequestMetadata,
  ): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const session = await this.prisma.refreshSession.findUnique({
        where: { id: payload.sid },
      });
      if (session && !session.revokedAt) {
        await this.prisma.refreshSession.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        await this.prisma.auditLog.create({
          data: {
            action: "AUTH_LOGOUT",
            actorId: session.userId,
            businessId: session.businessId,
            entityType: "RefreshSession",
            entityId: session.id,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          },
        });
      }
    } catch {
      // Logout remains idempotent and never reveals token validity.
    }
  }

  async logoutAll(user: RequestUser, metadata: RequestMetadata): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshSession.updateMany({
        where: { userId: user.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          action: "AUTH_LOGOUT_ALL",
          actorId: user.userId,
          businessId: user.businessId,
          entityType: "User",
          entityId: user.userId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      }),
    ]);
  }

  async profile(userId: string): Promise<AuthProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      ...userWithMembership,
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Utilisateur indisponible.");
    }
    return this.toProfile(user);
  }

  private async createSession(
    user: UserWithMembership,
    metadata: RequestMetadata,
  ): Promise<AuthResult> {
    const membership = user.memberships[0];
    const refreshExpiresAt = this.refreshExpiry();
    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        businessId: membership?.businessId,
        tokenHash: this.hashToken(randomUUID()),
        expiresAt: refreshExpiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
    const tokens = await this.issueTokens(user, session.id);
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { tokenHash: this.hashToken(tokens.refreshToken) },
    });
    return { ...tokens, refreshExpiresAt, profile: this.toProfile(user) };
  }

  private async issueTokens(user: UserWithMembership, sessionId: string) {
    const membership = user.memberships[0];
    const accessPayload: RequestUser = {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: membership?.businessId ?? null,
      membershipRole: membership?.role ?? null,
      sessionId,
    };
    const refreshPayload: RefreshPayload = {
      sub: user.id,
      sid: sessionId,
      type: "refresh",
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.requiredConfig("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get<number>("JWT_ACCESS_TTL_SECONDS", 900),
        subject: user.id,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.requiredConfig("JWT_REFRESH_SECRET"),
        expiresIn: this.refreshDays() * 86_400,
        subject: user.id,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<RefreshPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.requiredConfig("JWT_REFRESH_SECRET"),
      });
      if (payload.type !== "refresh" || !payload.sub || !payload.sid)
        throw new Error();
      return payload;
    } catch {
      throw new UnauthorizedException("Session invalide ou expirée.");
    }
  }

  private async recordFailedLogin(
    user: User,
    metadata: RequestMetadata,
  ): Promise<void> {
    const maxAttempts = this.config.get<number>("AUTH_MAX_LOGIN_ATTEMPTS", 5);
    const nextAttempts = user.failedLoginAttempts + 1;
    const shouldLock = nextAttempts >= maxAttempts;
    const lockMinutes = this.config.get<number>("AUTH_LOCK_MINUTES", 15);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : nextAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + lockMinutes * 60_000)
            : null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          action: shouldLock ? "AUTH_ACCOUNT_LOCKED" : "AUTH_LOGIN_FAILED",
          actorId: user.id,
          entityType: "User",
          entityId: user.id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      }),
    ]);
  }

  private async writeAudit(
    action: string,
    user: UserWithMembership,
    metadata: RequestMetadata,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        actorId: user.id,
        businessId: user.memberships[0]?.businessId,
        entityType: "User",
        entityId: user.id,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
  }

  private toProfile(user: UserWithMembership): AuthProfile {
    const membership = user.memberships[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business: membership
        ? {
            id: membership.business.id,
            name: membership.business.name,
            slug: membership.business.slug,
            membershipRole: membership.role,
          }
        : null,
    };
  }

  private async availableSlug(
    transaction: Prisma.TransactionClient,
    baseSlug: string,
  ): Promise<string> {
    const base = baseSlug || "entreprise";
    for (let suffix = 0; suffix < 100; suffix += 1) {
      const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
      const exists = await transaction.business.findUnique({
        where: { slug: candidate },
      });
      if (!exists) return candidate;
    }
    return `${base}-${randomUUID().slice(0, 8)}`;
  }

  private slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private refreshDays(): number {
    return this.config.get<number>("JWT_REFRESH_TTL_DAYS", 30);
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.refreshDays() * 86_400_000);
  }

  private requiredConfig(name: string): string {
    return this.config.getOrThrow<string>(name);
  }
}
