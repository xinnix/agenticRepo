import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../../../trpc/trpc';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// 🔥 使用 @opencode/shared 的 Zod schema
import {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
} from '@opencode/shared';

// Helper functions
function generateAccessToken(userId: string, email: string): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { sub: userId, email },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  );
}

function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

async function calculateRefreshTokenExpiry() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30); // 30 days
  return expiry;
}

export const authRouter = router({
  // Register new user
  register: publicProcedure
    .input(RegisterSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { username: input.username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === input.email) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already registered',
          });
        }
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Get default viewer role
      const viewerRole = await ctx.prisma.role.findUnique({
        where: { slug: 'viewer' },
      });

      if (!viewerRole) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Viewer role not found. Please run database seed first.',
        });
      }

      // Create user
      const user = await ctx.prisma.user.create({
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
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken();
      const expiresAt = await calculateRefreshTokenExpiry();

      // Save refresh token
      await ctx.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      // Sanitize user and flatten permissions for response
      const { passwordHash: _, ...sanitizedUser } = user;

      // Flatten permissions from roles into a simple array
      const permissions = sanitizedUser.roles?.flatMap((ur: any) =>
        ur.role.permissions?.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`)
      ) || [];

      return {
        user: {
          ...sanitizedUser,
          permissions,
        },
        accessToken,
        refreshToken,
      };
    }),

  // Login
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ ctx, input }) => {
      // Find user
      const user = await ctx.prisma.user.findUnique({
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
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Check if active
      if (!user.isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Account is disabled',
        });
      }

      // Update last login
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken();
      const expiresAt = await calculateRefreshTokenExpiry();

      // Save refresh token
      await ctx.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      // Sanitize user and flatten permissions
      const { passwordHash: _, ...sanitizedUser } = user;

      // Flatten permissions from roles into a simple array
      const permissions = sanitizedUser.roles?.flatMap((ur: any) =>
        ur.role.permissions?.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`)
      ) || [];

      return {
        user: {
          ...sanitizedUser,
          permissions,
        },
        accessToken,
        refreshToken,
      };
    }),

  // Refresh token
  refreshToken: publicProcedure
    .input(RefreshTokenSchema)
    .mutation(async ({ ctx, input }) => {
      // Find refresh token
      const token = await ctx.prisma.refreshToken.findUnique({
        where: { token: input.refreshToken },
        include: { user: true },
      });

      if (!token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }

      // Check if revoked or expired
      if (token.revokedAt || token.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Refresh token expired',
        });
      }

      // Check if user is active
      if (!token.user.isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Account is disabled',
        });
      }

      // Generate new tokens
      const accessToken = generateAccessToken(token.user.id, token.user.email);
      const newRefreshToken = generateRefreshToken();
      const expiresAt = await calculateRefreshTokenExpiry();

      // Revoke old token
      await ctx.prisma.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() },
      });

      // Save new refresh token
      await ctx.prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: token.user.id,
          expiresAt,
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    }),

  // Get current user
  me: protectedProcedure
    .query(async ({ ctx }) => {
      // User is already verified in protectedProcedure middleware
      // Return the user from context
      return {
        id: ctx.user.id,
        email: ctx.user.email,
        username: ctx.user.username,
        permissions: ctx.user.permissions,
        roles: ctx.user.roles,
      };
    }),

  // Logout
  logout: protectedProcedure
    .input(RefreshTokenSchema)
    .mutation(async ({ ctx, input }) => {
      // Revoke refresh token
      await ctx.prisma.refreshToken.updateMany({
        where: {
          token: input.refreshToken,
        },
        data: { revokedAt: new Date() },
      });

      return { success: true };
    }),
});
