import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthSessionsService } from "./auth-sessions.service";
import type { RequestMetadata, RequestUser } from "./auth.types";
import { ListSessionsDto } from "./dto/list-sessions.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

type AuthenticatedRequest = Request & { user: RequestUser };

@Controller("auth/sessions")
@UseGuards(JwtAuthGuard)
export class AuthSessionsController {
  constructor(private readonly sessions: AuthSessionsService) {}

  @Get()
  listMine(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListSessionsDto,
  ) {
    return this.sessions.listMine(request.user, query);
  }

  @Delete(":sessionId")
  @HttpCode(204)
  async revokeOther(
    @Req() request: AuthenticatedRequest,
    @Param("sessionId") sessionId: string,
  ): Promise<void> {
    await this.sessions.revokeOther(
      request.user,
      sessionId,
      this.metadata(request),
    );
  }

  private metadata(request: Request): RequestMetadata {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress ?? null,
      userAgent: request.get("user-agent") ?? null,
    };
  }
}