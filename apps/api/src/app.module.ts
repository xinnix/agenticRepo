// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";

// 基础模块
import { AuthModule } from "./modules/auth/module";
import { TodoModule } from "./modules/todo/module";
import { UserModule } from "./modules/user/module";

// 全局过滤器/拦截器
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AllExceptionsFilter } from "./core/filters/http-exception.filter";
import { TransformInterceptor } from "./core/interceptors/transform.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env.local", "../../.env"],
    }),
    // 数据库模块（全局，必须在最前）
    PrismaModule,
    // 基础模块
    AuthModule,
    TodoModule,
    UserModule,
  ],
  providers: [
    Reflector,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
