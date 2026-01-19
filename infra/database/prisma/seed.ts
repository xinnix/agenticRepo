import 'dotenv/config';
import { PrismaClient } from '@opencode/database';
import type { Permission } from '../generated/client';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. Create Permissions
  // ============================================
  console.log('Creating permissions...');

  const permissions = await Promise.all([
    // Todo permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'create' } },
      update: {},
      create: { resource: 'todo', action: 'create', description: '创建待办事项' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'read' } },
      update: {},
      create: { resource: 'todo', action: 'read', description: '查看待办事项' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'update' } },
      update: {},
      create: { resource: 'todo', action: 'update', description: '更新待办事项' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'delete' } },
      update: {},
      create: { resource: 'todo', action: 'delete', description: '删除待办事项' },
    }),
    // User permissions
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
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'manage_roles' } },
      update: {},
      create: { resource: 'user', action: 'manage_roles', description: '管理用户角色' },
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
    // Settings permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'settings', action: 'read' } },
      update: {},
      create: { resource: 'settings', action: 'read', description: '查看设置' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'settings', action: 'update' } },
      update: {},
      create: { resource: 'settings', action: 'update', description: '更新设置' },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 2. Create Roles
  // ============================================
  console.log('Creating roles...');

  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'super_admin' },
    update: {},
    create: {
      name: '超级管理员',
      slug: 'super_admin',
      level: 0,
      isSystem: true,
      description: '拥有所有权限的超级管理员',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: '管理员',
      slug: 'admin',
      level: 10,
      isSystem: true,
      description: '管理员，拥有除用户管理外的大部分权限',
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { slug: 'editor' },
    update: {},
    create: {
      name: '编辑',
      slug: 'editor',
      level: 50,
      isSystem: true,
      description: '可以创建、编辑和查看内容',
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { slug: 'viewer' },
    update: {},
    create: {
      name: '查看者',
      slug: 'viewer',
      level: 100,
      isSystem: true,
      description: '只能查看内容',
    },
  });

  console.log('✅ Created 4 roles');

  // ============================================
  // 3. Assign Permissions to Roles
  // ============================================
  console.log('Assigning permissions to roles...');

  // Super Admin: All permissions
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

  // Admin: All except user.manage_roles
  const adminPermissions = permissions.filter(
    (p: Permission) => !(p.resource === 'user' && p.action === 'manage_roles')
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

  // Editor: todo.create, todo.read, todo.update, settings.read
  const editorPermissions = permissions.filter(
    (p: Permission) =>
      (p.resource === 'todo' &&
        ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'settings' && p.action === 'read')
  );
  for (const permission of editorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: editorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: editorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Viewer: Only read permissions
  const viewerPermissions = permissions.filter((p: Permission) => p.action === 'read');
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
  // 4. Create Admin User
  // ============================================
  console.log('Creating admin user...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash },
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
  });

  // Assign super_admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('✅ Created admin user (admin@example.com / admin123)');

  // ============================================
  // 5. Create Test Users (optional)
  // ============================================
  console.log('Creating test users...');

  const testUsers = [
    {
      username: 'editor1',
      email: 'editor@example.com',
      password: 'test123',
      firstName: '张',
      lastName: '编辑',
      role: editorRole,
    },
    {
      username: 'viewer1',
      email: 'viewer@example.com',
      password: 'test123',
      firstName: '李',
      lastName: '查看',
      role: viewerRole,
    },
    {
      username: 'admin1',
      email: 'admin1@example.com',
      password: 'admin123',
      firstName: '王',
      lastName: '管理',
      role: adminRole,
    },
    {
      username: 'admin2',
      email: 'admin2@example.com',
      password: 'admin123',
      firstName: '赵',
      lastName: '管理员',
      role: adminRole,
    },
    {
      username: 'super_admin2',
      email: 'super2@example.com',
      password: 'super123',
      firstName: '陈',
      lastName: '超级',
      role: superAdminRole,
    },
  ];

  for (const testUser of testUsers) {
    const passwordHash = await bcrypt.hash(testUser.password, 10);

    const user = await prisma.user.upsert({
      where: { email: testUser.email },
      update: { passwordHash },
      create: {
        username: testUser.username,
        email: testUser.email,
        passwordHash,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        isActive: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: testUser.role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: testUser.role.id,
      },
    });
  }

  console.log('✅ Created test users');

  // ============================================
  // 6. Create Mock Todos
  // ============================================
  console.log('Creating mock todos...');

  const todoTitles = [
    '完成项目文档',
    '修复登录bug',
    '优化数据库查询',
    '添加用户权限管理',
    '更新API文档',
    '编写单元测试',
    '代码审查',
    '部署到生产环境',
    '团队周会',
    '学习新技术',
  ];

  for (const title of todoTitles) {
    await prisma.todo.upsert({
      where: { id: `todo-${title}` },
      update: {},
      create: {
        id: `todo-${title}`,
        title,
        description: `这是关于"${title}"的详细描述`,
        priority: Math.floor(Math.random() * 3) + 1,
        isCompleted: Math.random() > 0.7,
        createdById: adminUser.id,
        updatedById: adminUser.id,
      },
    });
  }

  console.log('✅ Created mock todos');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Super Admin:');
  console.log('    - admin@example.com / admin123');
  console.log('    - super2@example.com / super123');
  console.log('  Admin:');
  console.log('    - admin1@example.com / admin123');
  console.log('    - admin2@example.com / admin123');
  console.log('  Editor:');
  console.log('    - editor@example.com / test123');
  console.log('  Viewer:');
  console.log('    - viewer@example.com / test123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
