import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

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
  ) {
    console.log('[AuthService] ================================');
    console.log('[AuthService] JWT_SECRET from process.env:', !!process.env.JWT_SECRET);
    console.log('[AuthService] process.env.JWT_SECRET value:', process.env.JWT_SECRET?.substring(0, 30) + '...');
    console.log('[AuthService] ================================');
  }

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
    const userRole = await this.prisma.role.findUnique({
      where: { slug: 'user' },
    });

    if (!userRole) {
      throw new Error('普通用户角色未找到，请先运行数据库种子');
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
            roleId: userRole.id,
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
    console.log('[AuthService] Generating token with JWT_SECRET:', !!process.env.JWT_SECRET);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    console.log('[AuthService] Generated token:', accessToken.substring(0, 30) + '...');

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

  /**
   * 📱 微信小程序登录
   */
  async wxLogin(input: {
    code: string;
    phoneCode?: string; // 手机号改为可选
    userInfo?: { nickName: string; avatarUrl: string };
  }) {
    console.log('DEBUG wxLogin - prisma:', !!this.prisma, 'jwt:', !!this.jwtService);
    // 1️⃣ 从环境变量获取微信配置
    const wxAppId = process.env.WX_APP_ID;
    const wxAppSecret = process.env.WX_APP_SECRET;

    if (!wxAppId || !wxAppSecret) {
      throw new Error('微信配置未设置，请在环境变量中配置 WX_APP_ID 和 WX_APP_SECRET');
    }

    // 2️⃣ 通过 code 换取 openid 和 session_key
    let openid: string;
    try {
      const wxResponse = await axios.get(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${wxAppId}&secret=${wxAppSecret}&js_code=${input.code}&grant_type=authorization_code`,
      );
      openid = wxResponse.data.openid;
      if (!openid) {
        throw new Error(`获取 openid 失败: ${JSON.stringify(wxResponse.data)}`);
      }
    } catch (error) {
      Logger.error('微信登录失败', error);
      throw new UnauthorizedException('微信登录失败，请重试');
    }

    // 3️⃣ 通过 phoneCode 换取手机号（如果提供了 phoneCode）
    let phone: string | undefined;
    if (input.phoneCode) {
      try {
        const phoneResponse = await axios.post(
          `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${await this.getWxAccessToken()}`,
          { code: input.phoneCode },
        );
        phone = phoneResponse.data.phone_info?.phoneNumber;
      } catch (error) {
        Logger.warn('获取手机号失败，继续登录流程', error);
      }
    }

    // 4️⃣ 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { wxOpenId: openid },
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
      // 获取普通用户角色
      const userRole = await this.prisma.role.findUnique({
        where: { slug: 'user' },
      });

      if (!userRole) {
        throw new Error('普通用户角色未找到，请先运行数据库种子');
      }

      // 创建新用户
      user = await this.prisma.user.create({
        data: {
          wxOpenId: openid,
          phone,
          wxNickname: input.userInfo?.nickName,
          wxAvatarUrl: input.userInfo?.avatarUrl,
          username: `wx_${openid.substring(0, 8)}`,
          email: `wx_${openid.substring(0, 8)}@temp.local`, // 临时邮箱
          passwordHash: '', // 微信登录不需要密码
          isActive: true,
          roles: {
            create: {
              roleId: userRole.id,
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
    } else {
      // 更新现有用户信息
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          phone: phone || user.phone,
          wxNickname: input.userInfo?.nickName || user.wxNickname,
          wxAvatarUrl: input.userInfo?.avatarUrl || user.wxAvatarUrl,
          lastLoginAt: new Date(),
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
    }

    // 5️⃣ 生成 JWT token
    const { accessToken, refreshToken } = await this.generateTokens(user as any);

    // 6️⃣ 返回用户信息
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
   * 📱 获取微信 access_token（用于获取手机号等接口）
   */
  private async getWxAccessToken(): Promise<string> {
    const wxAppId = process.env.WX_APP_ID;
    const wxAppSecret = process.env.WX_APP_SECRET;

    const response = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${wxAppId}&secret=${wxAppSecret}`,
    );

    return response.data.access_token;
  }
}
