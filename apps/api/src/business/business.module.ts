import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BusinessAccessGuard } from "../auth/business-access.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaModule } from "../database/prisma.module";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BusinessController],
  providers: [BusinessService, JwtAuthGuard, BusinessAccessGuard],
})
export class BusinessModule {}
