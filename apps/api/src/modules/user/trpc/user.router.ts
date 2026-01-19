import { createCrudRouterWithCustom } from "../../../trpc/trpc.helper";
import {
  router,
  permissionProcedure,
  publicProcedure,
} from "../../../trpc/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { UserSchema, UserListQuerySchema, AssignRoleSchema, BatchAssignRolesSchema, ResetPasswordSchema } from "@opencode/shared";

/**
 * User tRPC Router
 *
 * Uses createCrudRouterWithCustom to provide standard CRUD operations
 * plus custom procedures for user management.
 */
export const userRouter = createCrudRouterWithCustom(
  "User",
  {
    create: UserSchema.createInput,
    update: UserSchema.updateInput,
  },
  (t) => ({
    // Custom getMany with search and filters
    getMany: publicProcedure
      .input(UserListQuerySchema.optional())
      .query(async ({ ctx, input }) => {
        const {
          page = 1,
          pageSize = 10,
          search,
          isActive,
          roleSlug,
        } = input || {};
        const skip = (page - 1) * pageSize;

        const where: any = {};

        if (search) {
          where.OR = [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ];
        }

        if (isActive !== undefined) {
          where.isActive = isActive;
        }

        if (roleSlug) {
          where.roles = {
            some: {
              role: { slug: roleSlug },
            },
          };
        }

        const [users, total] = await Promise.all([
          ctx.prisma.user.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isActive: true,
              emailVerified: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true,
              roles: {
                select: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      level: true,
                    },
                  },
                },
              },
            },
          }),
          ctx.prisma.user.count({ where }),
        ]);

        return {
          items: users.map((user) => ({
            ...user,
            roles: user.roles.map((r) => r.role),
          })),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }),

    // Custom getOne with roles
    getOne: permissionProcedure("user", "read")
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.id },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            roles: {
              select: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    level: true,
                    description: true,
                    isSystem: true,
                  },
                },
                assignedAt: true,
              },
              orderBy: { role: { level: "asc" } },
            },
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        return {
          ...user,
          roles: user.roles.map((r) => ({
            ...r.role,
            assignedAt: r.assignedAt,
          })),
        };
      }),

    // Custom createOne with password hashing and default role
    createOne: permissionProcedure("user", "create")
      .input(
        z.object({
          data: UserSchema.createInput,
          include: z.any().optional(),
          select: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { data } = input;

        // Check if username or email already exists
        const existing = await ctx.prisma.user.findFirst({
          where: {
            OR: [{ username: data.username }, { email: data.email }],
          },
        });

        if (existing) {
          throw new Error("Username or email already exists");
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Create user with default viewer role
        const viewerRole = await ctx.prisma.role.findUnique({
          where: { slug: "viewer" },
        });

        const user = await ctx.prisma.user.create({
          data: {
            username: data.username,
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: viewerRole
              ? {
                  create: {
                    roleId: viewerRole.id,
                    assignedBy: null,
                  },
                }
              : undefined,
          },
          select: input.select || {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
          include: input.include,
        });

        return user;
      }),

    // Custom updateOne with validation
    updateOne: permissionProcedure("user", "update")
      .input(
        z.object({
          id: z.string(),
          data: UserSchema.updateInput,
          include: z.any().optional(),
          select: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, data } = input;

        // Check if user exists
        const existing = await ctx.prisma.user.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new Error("User not found");
        }

        // Check if username/email is taken by another user
        if (data.username || data.email) {
          const orConditions: any[] = [];
          if (data.username) orConditions.push({ username: data.username });
          if (data.email) orConditions.push({ email: data.email });

          const duplicate = await ctx.prisma.user.findFirst({
            where: {
              AND: [{ id: { not: id } }, { OR: orConditions }],
            },
          });

          if (duplicate) {
            throw new Error("Username or email already exists");
          }
        }

        const user = await ctx.prisma.user.update({
          where: { id },
          data,
          select: input.select || {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            updatedAt: true,
          },
          include: input.include,
        });

        return user;
      }),

    // Custom deleteOne with protection for last super admin
    deleteOne: permissionProcedure("user", "delete")
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Prevent self-deletion
        if (input.id === (ctx as any).user?.id) {
          throw new Error("Cannot delete yourself");
        }

        // Check if user exists
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.id },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Check if user is the last super admin
        const hasSuperAdmin = user.roles.some(
          (ur) => ur.role.slug === "super_admin"
        );
        if (hasSuperAdmin) {
          const superAdminCount = await ctx.prisma.user.count({
            where: {
              roles: {
                some: {
                  role: { slug: "super_admin" },
                },
              },
            },
          });

          if (superAdminCount <= 1) {
            throw new Error("Cannot delete the last super admin");
          }
        }

        await ctx.prisma.user.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),

    // Custom deleteMany with protection
    deleteMany: permissionProcedure("user", "delete")
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        const { ids } = input;

        // Filter out self
        const filteredIds = ids.filter((id) => id !== (ctx as any).user?.id);

        if (filteredIds.length === 0) {
          throw new Error("Cannot delete yourself");
        }

        // Check for last super admin
        const superAdminUsers = await ctx.prisma.user.findMany({
          where: {
            id: { in: filteredIds },
            roles: {
              some: {
                role: { slug: "super_admin" },
              },
            },
          },
        });

        if (superAdminUsers.length > 0) {
          const totalSuperAdmins = await ctx.prisma.user.count({
            where: {
              roles: {
                some: {
                  role: { slug: "super_admin" },
                },
              },
            },
          });

          if (totalSuperAdmins <= superAdminUsers.length) {
            throw new Error("Cannot delete all super admins");
          }
        }

        const result = await ctx.prisma.user.deleteMany({
          where: {
            id: { in: filteredIds },
          },
        });

        return { success: true, count: result.count };
      }),

    // Toggle user active status
    toggleActive: permissionProcedure("user", "update")
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Prevent self-deactivation
        if (input.id === (ctx as any).user?.id) {
          throw new Error("Cannot deactivate yourself");
        }

        const user = await ctx.prisma.user.findUnique({
          where: { id: input.id },
          select: { isActive: true },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const updatedUser = await ctx.prisma.user.update({
          where: { id: input.id },
          data: { isActive: !user.isActive },
          select: {
            id: true,
            isActive: true,
          },
        });

        return updatedUser;
      }),

    // Get user roles
    getRoles: permissionProcedure("user", "read")
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const userRoles = await ctx.prisma.userRole.findMany({
          where: { userId: input.id },
          include: {
            role: true,
          },
          orderBy: {
            role: { level: "asc" },
          },
        });

        return userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          slug: ur.role.slug,
          level: ur.role.level,
          description: ur.role.description,
          isSystem: ur.role.isSystem,
          assignedAt: ur.assignedAt,
        }));
      }),

    // Assign role to user
    assignRole: permissionProcedure("user", "manage_roles")
      .input(AssignRoleSchema)
      .mutation(async ({ ctx, input }) => {
        // Check if role exists
        const role = await ctx.prisma.role.findUnique({
          where: { id: input.roleId },
        });

        if (!role) {
          throw new Error("Role not found");
        }

        // Check if user already has this role
        const existing = await ctx.prisma.userRole.findUnique({
          where: {
            userId_roleId: {
              userId: input.userId,
              roleId: input.roleId,
            },
          },
        });

        if (existing) {
          throw new Error("User already has this role");
        }

        await ctx.prisma.userRole.create({
          data: {
            userId: input.userId,
            roleId: input.roleId,
            assignedBy: null,
          },
        });

        return { success: true };
      }),

    // Remove role from user
    removeRole: permissionProcedure("user", "manage_roles")
      .input(AssignRoleSchema)
      .mutation(async ({ ctx, input }) => {
        // Prevent removing own admin roles
        if (input.userId === (ctx as any).user?.id) {
          const role = await ctx.prisma.role.findUnique({
            where: { id: input.roleId },
          });

          if (role && role.level <= 10) {
            throw new Error("Cannot remove your own admin role");
          }
        }

        // Check if removing last admin role
        if (input.userId === (ctx as any).user?.id) {
          const remainingRoles = await ctx.prisma.userRole.count({
            where: {
              userId: input.userId,
              roleId: { not: input.roleId },
              role: { level: { lte: 10 } },
            },
          });

          if (remainingRoles === 0) {
            throw new Error("Cannot remove your last admin role");
          }
        }

        await ctx.prisma.userRole.delete({
          where: {
            userId_roleId: {
              userId: input.userId,
              roleId: input.roleId,
            },
          },
        });

        return { success: true };
      }),

    // Batch assign roles
    assignRoles: permissionProcedure("user", "manage_roles")
      .input(BatchAssignRolesSchema)
      .mutation(async ({ ctx, input }) => {
        const { userIds, roleIds } = input;

        // Check if roles exist
        const roles = await ctx.prisma.role.findMany({
          where: { id: { in: roleIds } },
        });

        if (roles.length !== roleIds.length) {
          throw new Error("One or more roles not found");
        }

        // Create user-role associations
        const operations = [];
        for (const userId of userIds) {
          for (const roleId of roleIds) {
            operations.push(
              ctx.prisma.userRole.createMany({
                data: {
                  userId,
                  roleId,
                  assignedBy: null,
                },
                skipDuplicates: true,
              })
            );
          }
        }

        await Promise.all(operations);

        return { success: true };
      }),

    // Reset user password
    resetPassword: permissionProcedure("user", "update")
      .input(ResetPasswordSchema)
      .mutation(async ({ ctx, input }) => {
        const passwordHash = await bcrypt.hash(input.newPassword, 10);

        await ctx.prisma.user.update({
          where: { id: input.userId },
          data: { passwordHash },
        });

        return { success: true };
      }),
  }),
  {
    // We provide our own custom CRUD implementations
    includeGetMany: false,
    includeGetOne: false,
    includeCreateOne: false,
    includeUpdateOne: false,
    includeDeleteOne: false,
    includeDeleteMany: false,
  }
);
