import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

// 设置数据库 URL
const DATABASE_URL = 'postgresql://xinnix:x12345678@127.0.0.1/agenticrepo';

// 延迟导入以使用正确的 DATABASE_URL
process.env.DATABASE_URL = DATABASE_URL;

import { PrismaClient } from '@opencode/database';

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. Create Permissions (仅用于 Admin)
  // ============================================
  console.log('Creating permissions...');

  const permissions = await Promise.all([
    // Todo permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'create' } },
      update: {},
      create: { resource: 'todo', action: 'create', description: '创建待办' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'read' } },
      update: {},
      create: { resource: 'todo', action: 'read', description: '查看待办' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'update' } },
      update: {},
      create: { resource: 'todo', action: 'update', description: '更新待办' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'delete' } },
      update: {},
      create: { resource: 'todo', action: 'delete', description: '删除待办' },
    }),

    // User permissions (管理小程序用户)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'create' } },
      update: {},
      create: { resource: 'user', action: 'create', description: '创建用户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'read' } },
      update: {},
      create: { resource: 'user', action: 'read', description: '查看用户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'update' } },
      update: {},
      create: { resource: 'user', action: 'update', description: '更新用户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'delete' } },
      update: {},
      create: { resource: 'user', action: 'delete', description: '删除用户' },
    }),

    // Admin permissions (管理员管理)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'create' } },
      update: {},
      create: { resource: 'admin', action: 'create', description: '创建管理员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'read' } },
      update: {},
      create: { resource: 'admin', action: 'read', description: '查看管理员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'update' } },
      update: {},
      create: { resource: 'admin', action: 'update', description: '更新管理员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'delete' } },
      update: {},
      create: { resource: 'admin', action: 'delete', description: '删除管理员' },
    }),

    // Role permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'create' } },
      update: {},
      create: { resource: 'role', action: 'create', description: '创建角色' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'read' } },
      update: {},
      create: { resource: 'role', action: 'read', description: '查看角色' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'update' } },
      update: {},
      create: { resource: 'role', action: 'update', description: '更新角色' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'delete' } },
      update: {},
      create: { resource: 'role', action: 'delete', description: '删除角色' },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 2. Create Roles (仅用于 Admin)
  // ============================================
  console.log('Creating roles...');

  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'super_admin' },
    update: {},
    create: {
      name: '超级管理员',
      slug: 'super_admin',
      description: '系统超级管理员，拥有所有权限',
      level: 0,
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: '管理员',
      slug: 'admin',
      description: '系统管理员',
      level: 100,
      isSystem: true,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { slug: 'viewer' },
    update: {},
    create: {
      name: '访客',
      slug: 'viewer',
      description: '只读权限管理员',
      level: 200,
      isSystem: true,
    },
  });

  console.log('✅ Created 3 roles');

  // ============================================
  // 3. Assign Permissions to Roles
  // ============================================
  console.log('Assigning permissions to roles...');

  // Super admin gets all permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin gets most permissions
  const adminPermissions = permissions.filter(
    (p) => !p.action.includes('delete') || p.resource === 'todo'
  );
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Viewer gets only read permissions
  const viewerPermissions = permissions.filter((p) => p.action === 'read');
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Assigned permissions to roles');

  // ============================================
  // 4. Create Demo Admin Users (管理端用户)
  // ============================================
  console.log('Creating demo admin users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.admin.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@example.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roles: {
        create: {
          roleId: superAdminRole.id,
        },
      },
    },
  });

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  const viewer = await prisma.admin.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      username: 'viewer',
      email: 'viewer@example.com',
      passwordHash,
      firstName: 'Viewer',
      lastName: 'Admin',
      roles: {
        create: {
          roleId: viewerRole.id,
        },
      },
    },
  });

  console.log('✅ Created 3 demo admin users');

  // ============================================
  // 5. Create Demo Miniapp Users (小程序用户)
  // ============================================
  console.log('Creating demo miniapp users...');

  const miniappUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      username: 'user',
      email: 'user@example.com',
      passwordHash,
      nickname: '测试用户',
      phone: '13800138000',
    },
  });

  const miniappUser2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      username: 'user2',
      email: 'user2@example.com',
      passwordHash,
      nickname: '测试用户2',
    },
  });

  console.log('✅ Created 2 demo miniapp users');

  // ============================================
  // 6. Create Demo Todos (关联到小程序用户)
  // ============================================
  console.log('Creating demo todos...');

  await prisma.todo.createMany({
    data: [
      {
        title: '学习 NestJS',
        description: '完成 NestJS 官方教程',
        priority: 1,
        userId: miniappUser.id,
      },
      {
        title: '学习 tRPC',
        description: '理解 tRPC 的基本概念和用法',
        priority: 2,
        userId: miniappUser.id,
      },
      {
        title: '学习 Prisma',
        description: '掌握 Prisma ORM 的基本操作',
        priority: 3,
        isCompleted: true,
        userId: miniappUser.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 3 demo todos');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📱 管理端测试账号 (Admin - password: password123):');
  console.log('  - superadmin@example.com (Super Admin)');
  console.log('  - admin@example.com (Admin)');
  console.log('  - viewer@example.com (Viewer)');
  console.log('');
  console.log('📱 小程序测试账号 (User - password: password123):');
  console.log('  - user@example.com (普通用户)');
  console.log('  - user2@example.com (普通用户2)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });