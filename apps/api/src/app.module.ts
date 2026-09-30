import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { BusinessModule } from "./business/business.module";
import { validateEnvironment } from "./config/environment";
import { PrismaModule } from "./database/prisma.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    AuthModule,
    BusinessModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
