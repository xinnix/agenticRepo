import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    console.log('[JwtStrategy] Constructor called');
    console.log('[JwtStrategy] JWT_SECRET from process.env:', !!process.env.JWT_SECRET);
    console.log('[JwtStrategy] process.env.JWT_SECRET value:', process.env.JWT_SECRET?.substring(0, 30) + '...');
    console.log('[JwtStrategy] Using secret:', secret.substring(0, 30) + '...');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });

    // 延迟检查 prisma（在 super() 调用之后）
    console.log('[JwtStrategy] PrismaService injected:', !!prisma);
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] ================================');
    console.log('[JwtStrategy] validate called');
    console.log('[JwtStrategy] payload:', JSON.stringify(payload));
    console.log('[JwtStrategy] payload.sub:', payload?.sub);
    console.log('[JwtStrategy] this.prisma:', !!this.prisma);
    console.log('[JwtStrategy] ================================');

    if (!payload || !payload.sub) {
      throw new Error('Invalid token payload');
    }

    // 从数据库获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (!user.isActive) {
      throw new Error('用户已被禁用');
    }

    // 扁平化权限
    const permissions = user.roles?.flatMap((ur: any) =>
      ur.role.permissions?.map((rp: any) =>
        `${rp.permission.resource}:${rp.permission.action}`,
      ),
    ) || [];

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles?.map((ur: any) => ur.role),
      permissions,
    };
  }
}
