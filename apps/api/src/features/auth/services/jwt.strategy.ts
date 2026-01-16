import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
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
