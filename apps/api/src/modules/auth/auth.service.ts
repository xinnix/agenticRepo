import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service';

interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user with default viewer role
    const viewerRole = await this.prisma.role.findUnique({
      where: { slug: 'viewer' },
    });

    if (!viewerRole) {
      throw new Error('Viewer role not found. Please run seed first.');
    }

    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
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

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is revoked or expired
    if (token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check if user is active
    if (!token.user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(token.user.id, token.user.email);

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    return tokens;
  }

  async me(userId: string) {
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
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async logout(userId: string, refreshToken: string) {
    // Revoke the refresh token
    await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any,
      }),
      this.createRefreshToken(userId),
    ]);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(userId: string) {
    // Generate a random token
    const token = this.generateRandomToken();

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Save to database
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private generateRandomToken(): string {
    return Buffer.from(Math.random().toString()).toString('base64').substring(0, 32);
  }

  private sanitizeUser(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitized } = user;

    // Flatten roles and permissions
    const roles = user.roles.map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
      slug: ur.role.slug,
      level: ur.role.level,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
    }));

    // Collect all unique permissions
    const permissionsSet = new Set<string>();
    user.roles.forEach((ur: any) => {
      ur.role.permissions.forEach((rp: any) => {
        permissionsSet.add(`${rp.permission.resource}:${rp.permission.action}`);
      });
    });

    const permissions = Array.from(permissionsSet);

    return {
      ...sanitized,
      roles,
      permissions,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
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

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}
