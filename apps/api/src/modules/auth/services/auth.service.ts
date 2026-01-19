import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { PrismaService } from '../../../prisma.service';

// 🔥 使用 @opencode/shared 的类型和 schema
import {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
  User,
} from '@opencode/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 🔐 注册新用户
   */
  async register(input: z.infer<typeof RegisterSchema>) {
    // 1️⃣ 验证输入
    const data = RegisterSchema.parse(input);

    // 2️⃣ 检查用户是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ConflictException('邮箱已被注册');
      }
      throw new ConflictException('用户名已存在');
    }

    // 3️⃣ 哈希密码
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 4️⃣ 获取默认角色
    const viewerRole = await this.prisma.role.findUnique({
      where: { slug: 'viewer' },
    });

    if (!viewerRole) {
      throw new Error('Viewer 角色未找到，请先运行数据库种子');
    }

    // 5️⃣ 创建用户
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: {
          create: {
            roleId: viewerRole.id,
          },
        },
      },
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

    // 6️⃣ 生成令牌
    const { accessToken, refreshToken } = await this.generateTokens(user as any);

    // 7️⃣ 返回用户信息（不包含密码哈希）
    const { passwordHash: _, ...sanitizedUser } = user;

    // 8️⃣ 扁平化权限
    const permissions = sanitizedUser.roles?.flatMap((ur: any) =>
      ur.role.permissions?.map((rp: any) =>
        `${rp.permission.resource}:${rp.permission.action}`,
      ),
    ) || [];

    return {
      user: {
        ...sanitizedUser,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * 🔑 用户登录
   */
  async login(input: z.infer<typeof LoginSchema>) {
    // 1️⃣ 验证输入
    const data = LoginSchema.parse(input);

    // 2️⃣ 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
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
      throw new UnauthorizedException('无效的凭证');
    }

    // 3️⃣ 验证密码
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('无效的凭证');
    }

    // 4️⃣ 检查账户状态
    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 5️⃣ 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6️⃣ 生成令牌
    const { accessToken, refreshToken } = await this.generateTokens(user as any);

    // 7️⃣ 返回用户信息
    const { passwordHash: _, ...sanitizedUser } = user;
    const permissions = sanitizedUser.roles?.flatMap((ur: any) =>
      ur.role.permissions?.map((rp: any) =>
        `${rp.permission.resource}:${rp.permission.action}`,
      ),
    ) || [];

    return {
      user: {
        ...sanitizedUser,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * 🔄 刷新令牌
   */
  async refreshToken(input: z.infer<typeof RefreshTokenSchema>) {
    const data = RefreshTokenSchema.parse(input);

    // 查找刷新令牌
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: data.refreshToken },
      include: { user: true },
    });

    if (!token) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    // 检查令牌是否被撤销或过期
    if (token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('刷新令牌已过期');
    }

    // 检查用户是否活跃
    if (!token.user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 生成新令牌
    const { accessToken, refreshToken } = await this.generateTokens(token.user as any);

    // 撤销旧令牌
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    return { accessToken, refreshToken };
  }

  /**
   * 👤 获取当前用户
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      throw new UnauthorizedException('用户未找到');
    }

    const { passwordHash: _, ...sanitizedUser } = user;
    const permissions = sanitizedUser.roles?.flatMap((ur: any) =>
      ur.role.permissions?.map((rp: any) =>
        `${rp.permission.resource}:${rp.permission.action}`,
      ),
    ) || [];

    return {
      ...sanitizedUser,
      permissions,
    };
  }

  /**
   * 🚪 用户登出
   */
  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * 🔐 生成访问令牌和刷新令牌
   */
  private async generateTokens(user: any) {
    // 生成访问令牌
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    // 生成刷新令牌
    const refreshToken = randomBytes(32).toString('hex');

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30天

    // 保存刷新令牌
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
