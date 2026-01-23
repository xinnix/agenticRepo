// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";

// 🔥 导入新架构的业务域模块
import { AuthModule } from "./modules/auth/module";
import { TodoModule } from "./modules/todo/module";
import { UserModule } from "./modules/user/module";
import { RoleModule } from "./modules/role/module";
import { CategoryModule } from "./modules/category/category.module";
import { TicketModule } from "./modules/ticket/module";
import { AttachmentModule } from "./modules/attachment/module";
import { NotificationModule } from "./modules/notification/module";
import { StatisticsModule } from "./modules/statistics/module";
import { DepartmentModule } from "./modules/department/department.module";
import { AreaModule } from "./modules/area/area.module";

// 全局过滤器/拦截器
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AllExceptionsFilter } from "./core/filters/http-exception.filter";
import { TransformInterceptor } from "./core/interceptors/transform.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    // 🔥 数据库模块（全局，必须在最前）
    PrismaModule,
    // 🔥 按业务域导入
    AuthModule,
    TodoModule,
    UserModule,
    RoleModule,
    CategoryModule,
    TicketModule,
    AttachmentModule,
    NotificationModule,
    StatisticsModule,
    DepartmentModule,
    AreaModule,
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
