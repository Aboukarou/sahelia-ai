import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { RequestMetadata, RequestUser } from "../auth/auth.types";
import { BusinessAccessGuard } from "../auth/business-access.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BusinessService } from "./business.service";
import { UpdateBusinessDto } from "./dto/update-business.dto";

type AuthenticatedRequest = Request & { user: RequestUser };

@Controller("business")
@UseGuards(JwtAuthGuard, BusinessAccessGuard)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}

  @Get("current")
  findCurrent(@Req() request: AuthenticatedRequest) {
    return this.businesses.findCurrent(request.user);
  }

  @Patch("current")
  updateCurrent(
    @Body() dto: UpdateBusinessDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.businesses.updateCurrent(
      request.user,
      dto,
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
