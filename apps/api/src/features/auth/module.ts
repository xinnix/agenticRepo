import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// 控制器
import { AuthController } from './rest/auth.controller';

// 服务
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './services/jwt.strategy';

// 数据库
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
  ],
  exports: [
    AuthService,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
