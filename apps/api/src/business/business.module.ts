import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BusinessAccessGuard } from "../auth/business-access.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaModule } from "../database/prisma.module";
import { BusinessController } from "./business.controller";
import { BusinessMembersService } from "./business-members.service";
import { BusinessService } from "./business.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    BusinessMembersService,
    JwtAuthGuard,
    BusinessAccessGuard,
  ],
})
export class BusinessModule {}
