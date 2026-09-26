import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import type { AuthResult, RequestMetadata, RequestUser } from "./auth.types";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

type AuthenticatedRequest = Request & { user: RequestUser };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.respond(
      await this.auth.register(dto, this.metadata(request)),
      response,
    );
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.respond(
      await this.auth.login(dto, this.metadata(request)),
      response,
    );
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.refreshCookie(request);
    if (!token) throw new UnauthorizedException("Session absente.");
    return this.respond(
      await this.auth.refresh(token, this.metadata(request)),
      response,
    );
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(this.refreshCookie(request), this.metadata(request));
    this.clearCookie(response);
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logoutAll(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logoutAll(request.user, this.metadata(request));
    this.clearCookie(response);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.profile(request.user.userId);
  }

  private respond(result: AuthResult, response: Response) {
    response.cookie(this.cookieName(), result.refreshToken, {
      httpOnly: true,
      secure: this.config.get("NODE_ENV") === "production",
      sameSite: "lax",
      path: "/api/auth",
      expires: result.refreshExpiresAt,
    });
    return { accessToken: result.accessToken, profile: result.profile };
  }

  private clearCookie(response: Response): void {
    response.clearCookie(this.cookieName(), {
      httpOnly: true,
      secure: this.config.get("NODE_ENV") === "production",
      sameSite: "lax",
      path: "/api/auth",
    });
  }

  private cookieName(): string {
    return this.config.get<string>("AUTH_COOKIE_NAME", "sahelia_refresh_token");
  }

  private refreshCookie(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const value = cookies?.[this.cookieName()];
    return typeof value === "string" ? value : undefined;
  }

  private metadata(request: Request): RequestMetadata {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress ?? null,
      userAgent: request.get("user-agent") ?? null,
    };
  }
}
