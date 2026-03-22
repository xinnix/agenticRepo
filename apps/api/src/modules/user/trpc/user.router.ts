import { createCrudRouterWithCustom } from "../../../trpc/trpc.helper";
import {
  router,
  permissionProcedure,
  publicProcedure,
} from "../../../trpc/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserListQuerySchema,
  AssignRoleSchema,
  BatchAssignRolesSchema,
  ResetPasswordSchema
} from "@opencode/shared";

/**
 * User tRPC Router
 *
 * Uses createCrudRouterWithCustom to provide standard CRUD operations
 * plus custom procedures for user management.
 */
export const userRouter = createCrudRouterWithCustom(
  "User",
  {
    create: CreateUserSchema,
    update: UpdateUserSchema,
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

    // Custom create with password hashing and default role (named 'create' for consistency with dataProvider)
    create: permissionProcedure("user", "create")
      .input(
        z.object({
          data: CreateUserSchema,
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

    // Custom update with validation (named 'update' for consistency with dataProvider)
    update: permissionProcedure("user", "update")
      .input(
        z.object({
          id: z.string(),
          data: UpdateUserSchema,
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

    // Custom delete with protection for last super admin
    delete: permissionProcedure("user", "delete")
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

        // Delete user using a transaction to handle foreign key constraints
        await ctx.prisma.$transaction(async (tx) => {
          // 1. Remove user from all roles
          await tx.userRole.deleteMany({
            where: { userId: input.id },
          });

          // 2. Handle tickets - remove assignment
          await tx.ticket.updateMany({
            where: { assignedId: input.id },
            data: { assignedId: null },
          });

          // 3. Handle tickets created by user - set to null or transfer
          // For now, we'll delete tickets created by this user
          await tx.ticket.deleteMany({
            where: { createdById: input.id },
          });

          // 4. Handle comments
          await tx.comment.deleteMany({
            where: { userId: input.id },
          });

          // 5. Handle status history
          await tx.statusHistory.deleteMany({
            where: { userId: input.id },
          });

          // 6. Handle notifications
          await tx.notification.deleteMany({
            where: { userId: input.id },
          });

          // 7. Handle attachments uploaded by user
          await tx.attachment.deleteMany({
            where: { uploadedById: input.id },
          });

          // 8. Handle refresh tokens
          await tx.refreshToken.deleteMany({
            where: { userId: input.id },
          });

          // 9. Finally delete the user
          await tx.user.delete({
            where: { id: input.id },
          });
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

        // Delete users using a transaction to handle foreign key constraints
        let deletedCount = 0;
        for (const userId of filteredIds) {
          await ctx.prisma.$transaction(async (tx) => {
            // 1. Remove user from all roles
            await tx.userRole.deleteMany({
              where: { userId },
            });

            // 2. Handle tickets - remove assignment
            await tx.ticket.updateMany({
              where: { assignedId: userId },
              data: { assignedId: null },
            });

            // 3. Handle tickets created by user
            await tx.ticket.deleteMany({
              where: { createdById: userId },
            });

            // 4. Handle comments
            await tx.comment.deleteMany({
              where: { userId },
            });

            // 5. Handle status history
            await tx.statusHistory.deleteMany({
              where: { userId },
            });

            // 6. Handle notifications
            await tx.notification.deleteMany({
              where: { userId },
            });

            // 7. Handle attachments
            await tx.attachment.deleteMany({
              where: { uploadedById: userId },
            });

            // 8. Handle refresh tokens
            await tx.refreshToken.deleteMany({
              where: { userId },
            });

            // 9. Delete the user
            await tx.user.delete({
              where: { id: userId },
            });
          });
          deletedCount++;
        }

        return { success: true, count: deletedCount };
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
          // 用户已有该角色，直接返回成功
          return { success: true, message: "用户已拥有该角色" };
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

    // ============================================
    // Handler (办事员) Statistics Procedures
    // ============================================

    // Get handler statistics for a single user
    getHandlerStats: publicProcedure
      .input(z.object({
        userId: z.string(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { userId, startDate, endDate } = input;

        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const [
          totalAssigned,
          completed,
          processing,
          waitAssign,
          overdue,
          avgRating,
          recentTickets,
        ] = await Promise.all([
          // Total assigned tickets
          ctx.prisma.ticket.count({
            where: {
              assignedId: userId,
              ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
            },
          }),
          // Completed tickets
          ctx.prisma.ticket.count({
            where: {
              assignedId: userId,
              status: "COMPLETED",
              ...(Object.keys(dateFilter).length > 0 ? { completedAt: dateFilter } : {}),
            },
          }),
          // Processing tickets
          ctx.prisma.ticket.count({
            where: {
              assignedId: userId,
              status: "PROCESSING",
            },
          }),
          // Wait assign tickets
          ctx.prisma.ticket.count({
            where: {
              assignedId: userId,
              status: "WAIT_ASSIGN",
            },
          }),
          // Overdue tickets
          ctx.prisma.ticket.count({
            where: {
              assignedId: userId,
              isOverdue: true,
            },
          }),
          // Average rating
          ctx.prisma.ticket.aggregate({
            where: {
              assignedId: userId,
              status: "CLOSED",
              rating: { not: null },
              ...(Object.keys(dateFilter).length > 0 ? { closedAt: dateFilter } : {}),
            },
            _avg: { rating: true },
          }),
          // Recent tickets (last 10)
          ctx.prisma.ticket.findMany({
            where: {
              assignedId: userId,
            },
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true,
              completedAt: true,
              rating: true,
            },
          }),
        ]);

        return {
          totalAssigned,
          completed,
          processing,
          waitAssign,
          overdue,
          avgRating: avgRating._avg.rating || 0,
          recentTickets,
        };
      }),

    // Get list of handlers (WeChat users with handler role)
    getHandlers: publicProcedure
      .input(z.object({
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
        departmentId: z.string().optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { page, pageSize, departmentId, isActive, search } = input;
        const skip = (page - 1) * pageSize;

        // Only get WeChat users with handler role
        const where: any = {
          // Must have WeChat OpenID (WeChat users only)
          wxOpenId: { not: null },
          // Must have handler role
          roles: {
            some: {
              role: { slug: "handler" },
            },
          },
        };

        if (departmentId) {
          where.departmentId = departmentId;
        }

        if (isActive !== undefined) {
          where.isActive = isActive;
        }

        if (search) {
          where.OR = [
            { username: { contains: search, mode: "insensitive" } },
            { realName: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { wxNickname: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ];
        }

        const [handlers, total] = await Promise.all([
          ctx.prisma.user.findMany({
            where,
            skip,
            take: pageSize,
            select: {
              id: true,
              username: true,
              realName: true,
              firstName: true,
              lastName: true,
              phone: true,
              wxNickname: true,
              wxAvatarUrl: true,
              position: true,
              isActive: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              _count: {
                select: {
                  assignedTickets: {
                    where: {
                      status: "PROCESSING",
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          ctx.prisma.user.count({ where }),
        ]);

        // Get completed count for each handler
        const handlerIds = handlers.map(h => h.id);
        const completedCounts = await Promise.all(
          handlerIds.map(id =>
            ctx.prisma.ticket.count({
              where: {
                assignedId: id,
                status: "CLOSED",
              },
            })
          )
        );

        const items = handlers.map((handler, index) => ({
          ...handler,
          currentTicketCount: handler._count.assignedTickets,
          completedTicketCount: completedCounts[index],
        }));

        return {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }),

    // ============================================
    // WeChat User Management Procedures
    // ============================================

    // Get WeChat users (users with wxOpenId)
    // Note: Users with handler role are excluded from this list as they become handlers
    getWxUsers: publicProcedure
      .input(z.object({
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
        search: z.string().optional(),
        isActive: z.boolean().optional(),
        roleSlug: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { page, pageSize, search, isActive, roleSlug } = input;
        const skip = (page - 1) * pageSize;

        // WeChat users have wxOpenId set
        // Exclude users who already have handler role (they become handlers)
        const where: any = {
          wxOpenId: { not: null },
          // Exclude users with handler role
          roles: {
            none: {
              role: { slug: "handler" },
            },
          },
        };

        if (search) {
          where.OR = [
            { wxNickname: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
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
              phone: true,
              realName: true,       // 新增：真实姓名
              wxNickname: true,
              wxAvatarUrl: true,
              wxOpenId: true,
              isActive: true,
              createdAt: true,
              lastLoginAt: true,
              position: true,
              departmentId: true,   // 新增：部门ID
              handlerStatus: true,  // 新增：办事员申请状态
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
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

    // ============================================
    // Admin User Management Procedures
    // ============================================

    // Get admin users (users without wxOpenId - backend login users)
    getAdminUsers: publicProcedure
      .input(z.object({
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
        search: z.string().optional(),
        isActive: z.boolean().optional(),
        roleSlug: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { page, pageSize, search, isActive, roleSlug } = input;
        const skip = (page - 1) * pageSize;

        // Admin users don't have wxOpenId (they login via backend)
        const where: any = {
          wxOpenId: null,
        };

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
              isActive: true,
              createdAt: true,
              lastLoginAt: true,
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

    // Create admin user with default admin role
    createAdminUser: permissionProcedure("user", "create")
      .input(z.object({
        data: z.object({
          username: z.string().min(3),
          email: z.string().email(),
          password: z.string().min(8),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        }),
      }))
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

        // Create user with admin role
        const adminRole = await ctx.prisma.role.findFirst({
          where: {
            slug: { in: ["admin", "super_admin"] },
          },
          orderBy: { level: "asc" },
        });

        const user = await ctx.prisma.user.create({
          data: {
            username: data.username,
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: adminRole
              ? {
                  create: {
                    roleId: adminRole.id,
                    assignedBy: null,
                  },
                }
              : undefined,
          },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
        });

        return user;
      }),

    // Get handler detail with extended information
    getHandlerDetail: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.id },
          select: {
            id: true,
            username: true,
            email: true,
            realName: true,
            firstName: true,
            lastName: true,
            phone: true,
            wxNickname: true,
            position: true,
            isActive: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            createdAt: true,
            lastLoginAt: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Get ticket statistics by status
        const ticketsByStatus = await ctx.prisma.ticket.groupBy({
          by: ["status"],
          where: { assignedId: input.id },
          _count: true,
        });

        const stats = {
          WAIT_ASSIGN: 0,
          PROCESSING: 0,
          COMPLETED: 0,
          CLOSED: 0,
        };

        ticketsByStatus.forEach(item => {
          stats[item.status as keyof typeof stats] = item._count;
        });

        // Get recent completed tickets
        const recentCompleted = await ctx.prisma.ticket.findMany({
          where: {
            assignedId: input.id,
            status: "CLOSED",
          },
          take: 5,
          orderBy: { closedAt: "desc" },
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            rating: true,
            closedAt: true,
          },
        });

        // Get current active tickets
        const activeTickets = await ctx.prisma.ticket.findMany({
          where: {
            assignedId: input.id,
            status: "PROCESSING",
          },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        });

        return {
          ...user,
          stats,
          recentCompleted,
          activeTickets,
        };
      }),

    // ============================================
    // Handler Application Procedures
    // ============================================

    // Approve handler application and assign department
    approveHandler: permissionProcedure("user", "update")
      .input(z.object({
        id: z.string().min(1),
        departmentId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id: userId, departmentId } = input;

        // Find handler role
        const handlerRole = await ctx.prisma.role.findUnique({
          where: { slug: "handler" },
        });

        if (!handlerRole) {
          throw new Error("Handler role not found");
        }

        // Check if user already has handler role
        const existingUserRole = await ctx.prisma.userRole.findUnique({
          where: {
            userId_roleId: {
              userId,
              roleId: handlerRole.id,
            },
          },
        });

        // Use transaction to ensure data consistency
        await ctx.prisma.$transaction(async (tx) => {
          // If user doesn't have handler role, add it
          if (!existingUserRole) {
            await tx.userRole.create({
              data: {
                userId,
                roleId: handlerRole.id,
                assignedBy: null,
              },
            });
          }

          // Update user status to approved
          await tx.user.update({
            where: { id: userId },
            data: {
              handlerStatus: "approved",
              departmentId: departmentId || null,
            },
          });
        });

        return { success: true, message: "已批准成为办事员" };
      }),

    // Reject handler application
    rejectHandler: permissionProcedure("user", "update")
      .input(z.object({
        id: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = input.id;

        await ctx.prisma.user.update({
          where: { id: userId },
          data: {
            handlerStatus: "rejected",
          },
        });

        return { success: true, message: "已拒绝申请" };
      }),
  }),
  {
    // We provide our own custom CRUD implementations
    includeGetMany: false,
    includeGetOne: false,
    includeCreate: false,
    includeUpdate: false,
    includeDelete: false,
    includeDeleteMany: false,
  }
);
