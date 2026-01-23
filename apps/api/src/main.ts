// apps/api/src/main.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from apps/api directory
dotenv.config();

// Also load DATABASE_URL from infra/database/.env
// For CommonJS compatibility, use relative path directly
dotenv.config({ path: path.resolve(__dirname, "../../../infra/database/.env") });

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./core/filters/http-exception.filter";

// Debug: Check if JWT_SECRET is loaded
console.log('[main.ts] JWT_SECRET from process.env:', process.env.JWT_SECRET?.substring(0, 20) + '...');
console.log('[main.ts] PORT:', process.env.PORT);
console.log('[main.ts] WX_APP_ID:', process.env.WX_APP_ID);
import { PrismaService } from "./prisma/prisma.service";
import { appRouter } from "./trpc/app.router";
import { createContext, setPrismaService } from "./trpc/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  const corsOrigin = process.env.CORS_ORIGIN || "*";

  app.enableCors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(","),
  });

  // Set global prefix for all REST API routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Set up tRPC middleware (tRPC handles body parsing internally)
  const prismaService = app.get(PrismaService);
  setPrismaService(prismaService); // 设置 PrismaService 实例
  console.log('DEBUG: PrismaService set in global:', !!prismaService);

  (app as any).use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: (opts) => createContext(opts),
      onError({ error, path }) {
        console.error(`tRPC Error on path '${path}':`, error);
      },
    })
  );

  // Set up Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle("OpenCode API")
    .setDescription("Full-stack monorepo with NestJS, tRPC, and Prisma")
    .setVersion("1.0")
    .addTag("todos", "Todo resource operations")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(port);
  console.log(`🚀 后端已启动: http://localhost:${port}/trpc`);
  console.log(`📚 API 文档: http://localhost:${port}/api/docs`);
  console.log(`🔌 REST API: http://localhost:${port}/api`);
}
bootstrap();
