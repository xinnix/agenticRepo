import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { PrismaService } from "../prisma/prisma.service";
import { WxacodeService } from "../modules/area/services/wxacode.service";
import jwt from "jsonwebtoken";

// Global PrismaService reference
let prismaServiceInstance: PrismaService | null = null;

export const setPrismaService = (prisma: PrismaService) => {
  prismaServiceInstance = prisma;
};

// Global WxacodeService reference
let wxacodeServiceInstance: WxacodeService | null = null;

export const setWxacodeService = (service: WxacodeService) => {
  wxacodeServiceInstance = service;
};

// User interface for context
export interface User {
  id: string;
  email: string;
  username?: string;
  departmentId?: string | null;
  permissions: string[];
  roles: any[];
}

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Extract and verify JWT token from Authorization header
 * Returns user object if token is valid, null otherwise
 */
async function verifyJwtToken(req: any, prisma: PrismaService): Promise<User | null> {
  try {
    // Extract Authorization header
    const authHeader = req?.headers?.authorization || req?.req?.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Fetch user from database with roles and permissions
    const user = await prisma.user.findUnique({
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

    if (!user || !user.isActive) {
      return null;
    }

    // Flatten permissions
    const permissions = user.roles?.flatMap((ur: any) =>
      ur.role.permissions?.map((rp: any) =>
        `${rp.permission.resource}:${rp.permission.action}`,
      ),
    ) || [];

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      departmentId: user.departmentId,
      permissions,
      roles: user.roles?.map((ur: any) => ur.role) || [],
    };
  } catch (error) {
    // Token is invalid or expired
    if (error instanceof jwt.JsonWebTokenError) {
      return null;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

// Create context with optional user (from JWT verification)
export const createContext = async (opts: any) => {
  const prisma = prismaServiceInstance || opts?.prisma;
  const wxacodeService = wxacodeServiceInstance || opts?.wxacodeService;
  const req = opts?.req;

  // Verify JWT token and get user
  let user: User | null = null;
  if (prisma && req) {
    user = await verifyJwtToken(req, prisma);
  }

  return {
    prisma,
    wxacodeService,
    req,
    res: opts?.res,
    user,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
// JWT token is verified in createContext, ctx.user will be null if no valid token
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid JWT token.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Permission procedure - requires specific permission
export const permissionProcedure = (resource: string, action: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const permissionString = `${resource}:${action}`;

    // Get user permissions from context
    const userPermissions: string[] = ctx.user?.permissions || [];

    // Import permission helpers
    const { isSuperAdmin } = await import('../shared/permissions');

    // Super admin has all permissions
    // Note: ctx.user.roles is an array of Role objects (from verifyJwtToken)
    const hasSuperAdminRole = ctx.user?.roles?.some((r: any) => r?.slug === 'super_admin') || false;
    // Handler role can approve handler applications
    const hasHandlerRole = ctx.user?.roles?.some((r: any) => r?.slug === 'handler') || false;

    // Special case: handler role can approve/reject handler applications
    if (resource === 'user' && (action === 'update') && hasHandlerRole) {
      return next();
    }

    if (!hasSuperAdminRole && !userPermissions.includes(permissionString)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing permission: ${permissionString}`,
      });
    }

    return next();
  });

// Department procedure - requires access to specific department
// Usage: departmentProcedure('read', 'user') - checks user:read_department permission
export const departmentProcedure = (resource: string, action: string, departmentIdField: string = 'departmentId') =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const permissionString = `${resource}:${action}_department`;

    // Import permission helpers
    const { isSuperAdmin, canAccessDepartment } = await import('../shared/permissions');

    // Check if user has department permission
    const hasSuperAdminRole = ctx.user?.roles?.some((r: any) => r.role.slug === 'super_admin');
    const hasPermission = ctx.user?.permissions?.includes(permissionString);

    if (!hasSuperAdminRole && !hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing permission: ${permissionString}`,
      });
    }

    // If not super admin, check department access
    if (!hasSuperAdminRole && ctx.user?.departmentId) {
      // Department is verified in the handler using canAccessDepartment
      return next({
        ctx: {
          ...ctx,
          departmentCheck: true,
        },
      });
    }

    return next();
  });

// Export permission helpers for use in routers
export { canAccessTicket, getTicketFilterForUser, getUserFilterForUser, getStatisticsFilterForUser } from '../shared/permissions';

// Re-export CRUD helpers from trpc.helper
export {
  createCrudRouter,
  createReadOnlyRouter,
  createCrudRouterWithCustom,
  type CrudRouterOptions,
} from './trpc.helper';

// BaseService can still be used for REST controllers or custom services
export { BaseService } from '../common/base.service';
