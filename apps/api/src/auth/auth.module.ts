import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthSessionsController } from "./auth-sessions.controller";
import { AuthSessionsService } from "./auth-sessions.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { BusinessAccessGuard } from "./business-access.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({}),
  ],
  controllers: [AuthController, AuthSessionsController],
  providers: [
    AuthService,
    AuthSessionsService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    BusinessAccessGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, BusinessAccessGuard],
})
export class AuthModule {}