import 'dotenv/config';
import { PrismaClient } from '@opencode/database';
import type { Permission } from '@opencode/database';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 0. Clean up old role data
  // ============================================
  console.log('Cleaning up old role data...');

  // Delete old dept_admin role if exists (renamed to department_admin)
  await prisma.role.deleteMany({
    where: { slug: 'dept_admin' },
  }).catch(() => {});

  // Delete old role permissions and user roles for consistency
  await prisma.rolePermission.deleteMany({});
  await prisma.userRole.deleteMany({});

  console.log('✅ Cleaned up old data');

  // ============================================
  // 1. Create Departments
  // ============================================
  console.log('Creating departments...');

  const techDept = await prisma.department.upsert({
    where: { code: 'TECH' },
    update: {},
    create: {
      name: '技术部',
      code: 'TECH',
    },
  });

  const adminDept = await prisma.department.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: '行政部',
      code: 'ADMIN',
    },
  });

  const serviceDept = await prisma.department.upsert({
    where: { code: 'SERVICE' },
    update: {},
    create: {
      name: '客服部',
      code: 'SERVICE',
    },
  });

  console.log('✅ Created 3 departments');

  // ============================================
  // 2. Create Permissions
  // ============================================
  console.log('Creating permissions...');

  const permissions = await Promise.all([
    // Ticket permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'create' } },
      update: {},
      create: { resource: 'ticket', action: 'create', description: '创建工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'read' } },
      update: {},
      create: { resource: 'ticket', action: 'read', description: '查看工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'read_all' } },
      update: {},
      create: { resource: 'ticket', action: 'read_all', description: '查看所有工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'read_department' } },
      update: {},
      create: { resource: 'ticket', action: 'read_department', description: '查看本部门工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'update' } },
      update: {},
      create: { resource: 'ticket', action: 'update', description: '更新工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'delete' } },
      update: {},
      create: { resource: 'ticket', action: 'delete', description: '删除工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'assign' } },
      update: {},
      create: { resource: 'ticket', action: 'assign', description: '指派工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'accept' } },
      update: {},
      create: { resource: 'ticket', action: 'accept', description: '接单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'process' } },
      update: {},
      create: { resource: 'ticket', action: 'process', description: '处理工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'complete' } },
      update: {},
      create: { resource: 'ticket', action: 'complete', description: '完成工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'close' } },
      update: {},
      create: { resource: 'ticket', action: 'close', description: '关闭工单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'ticket', action: 'rate' } },
      update: {},
      create: { resource: 'ticket', action: 'rate', description: '评价工单' },
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
      where: { resource_action: { resource: 'user', action: 'read_department' } },
      update: {},
      create: { resource: 'user', action: 'read_department', description: '查看本部门用户' },
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
      create: { resource: 'user', action: 'manage_roles', description: '管理角色' },
    }),
    // Department permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'department', action: 'read' } },
      update: {},
      create: { resource: 'department', action: 'read', description: '查看部门' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'department', action: 'read_all' } },
      update: {},
      create: { resource: 'department', action: 'read_all', description: '查看所有部门' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'department', action: 'update' } },
      update: {},
      create: { resource: 'department', action: 'update', description: '更新部门' },
    }),
    // Handler permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'handler', action: 'read' } },
      update: {},
      create: { resource: 'handler', action: 'read', description: '查看办事员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'handler', action: 'read_department' } },
      update: {},
      create: { resource: 'handler', action: 'read_department', description: '查看本部门办事员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'handler', action: 'assign' } },
      update: {},
      create: { resource: 'handler', action: 'assign', description: '指派工单给办事员' },
    }),
    // Category permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'category', action: 'read' } },
      update: {},
      create: { resource: 'category', action: 'read', description: '查看分类' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'category', action: 'manage' } },
      update: {},
      create: { resource: 'category', action: 'manage', description: '管理分类' },
    }),
    // Preset Area permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'preset_area', action: 'read' } },
      update: {},
      create: { resource: 'preset_area', action: 'read', description: '查看预设区域' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'preset_area', action: 'manage' } },
      update: {},
      create: { resource: 'preset_area', action: 'manage', description: '管理预设区域' },
    }),
    // Statistics permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'statistics', action: 'view' } },
      update: {},
      create: { resource: 'statistics', action: 'view', description: '查看统计' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'statistics', action: 'view_department' } },
      update: {},
      create: { resource: 'statistics', action: 'view_department', description: '查看本部门统计' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'statistics', action: 'export' } },
      update: {},
      create: { resource: 'statistics', action: 'export', description: '导出统计' },
    }),
    // Attachment permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'attachment', action: 'upload' } },
      update: {},
      create: { resource: 'attachment', action: 'upload', description: '上传附件' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'attachment', action: 'delete' } },
      update: {},
      create: { resource: 'attachment', action: 'delete', description: '删除附件' },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 3. Create Roles
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
    where: { slug: 'department_admin' },
    update: {},
    create: {
      name: '管理员',
      slug: 'department_admin',
      level: 10,
      isSystem: true,
      description: '管理员，可管理部门工单和用户',
    },
  });

  const handlerRole = await prisma.role.upsert({
    where: { slug: 'handler' },
    update: {},
    create: {
      name: '处理员',
      slug: 'handler',
      level: 50,
      isSystem: true,
      description: '工单处理员',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { slug: 'user' },
    update: {},
    create: {
      name: '普通用户',
      slug: 'user',
      level: 100,
      isSystem: true,
      description: '普通用户，可创建和查看自己的工单',
    },
  });

  console.log('✅ Created 4 roles');

  // ============================================
  // 3.5. Clean up any extra roles
  // ============================================
  console.log('Cleaning up extra roles...');

  const validRoleSlugs = ['super_admin', 'department_admin', 'handler', 'user'];
  const deletedRoles = await prisma.role.deleteMany({
    where: {
      slug: {
        notIn: validRoleSlugs,
      },
    },
  });

  if (deletedRoles.count > 0) {
    console.log(`✅ Deleted ${deletedRoles.count} extra roles`);
  }

  // ============================================
  // 4. Assign Permissions to Roles
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

  // Department Admin: 本部门管理权限
  const deptAdminPermissions = permissions.filter((p: Permission) => {
    // 不能删除用户
    if (p.resource === 'user' && p.action === 'delete') return false;
    // 不能查看所有部门
    if (p.resource === 'department' && p.action === 'read_all') return false;
    // 不能管理全局系统设置
    if (p.resource === 'settings') return false;
    return true;
  });
  for (const permission of deptAdminPermissions) {
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

  // Handler: 处理工单权限
  const handlerPermissions = permissions.filter((p: Permission) => {
    // 所有工单相关操作（除了删除）
    if (p.resource === 'ticket' && p.action !== 'delete') return true;
    // 查看统计
    if (p.resource === 'statistics' && p.action === 'view') return true;
    // 查看部门统计
    if (p.resource === 'statistics' && p.action === 'view_department') return true;
    // 查看分类
    if (p.resource === 'category' && p.action === 'read') return true;
    // 查看预设区域
    if (p.resource === 'preset_area' && p.action === 'read') return true;
    // 上传附件
    if (p.resource === 'attachment' && p.action === 'upload') return true;
    return false;
  });
  for (const permission of handlerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: handlerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: handlerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // User: 基本权限 - 创建工单和查看自己的工单
  const userPermissions = permissions.filter((p: Permission) => {
    // 创建工单
    if (p.resource === 'ticket' && p.action === 'create') return true;
    // 查看工单
    if (p.resource === 'ticket' && p.action === 'read') return true;
    // 评价工单
    if (p.resource === 'ticket' && p.action === 'rate') return true;
    // 上传附件
    if (p.resource === 'attachment' && p.action === 'upload') return true;
    // 查看分类
    if (p.resource === 'category' && p.action === 'read') return true;
    // 查看预设区域
    if (p.resource === 'preset_area' && p.action === 'read') return true;
    // 查看部门
    if (p.resource === 'department' && p.action === 'read') return true;
    return false;
  });
  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Assigned permissions to roles');

  // ============================================
  // 5. Create Categories
  // ============================================
  console.log('Creating categories...');

  const techCategory = await prisma.category.upsert({
    where: { slug: 'tech-issue' },
    update: {},
    create: {
      name: '技术问题',
      slug: 'tech-issue',
      description: '软件、硬件等技术相关问题',
      status: 'ACTIVE',
      level: 1,
      sortOrder: 1,
    },
  });

  const facilityCategory = await prisma.category.upsert({
    where: { slug: 'facility' },
    update: {},
    create: {
      name: '设施问题',
      slug: 'facility',
      description: '办公设施、环境等问题',
      status: 'ACTIVE',
      level: 1,
      sortOrder: 2,
    },
  });

  const adminCategory = await prisma.category.upsert({
    where: { slug: 'admin-issue' },
    update: {},
    create: {
      name: '行政事务',
      slug: 'admin-issue',
      description: '人事、财务等行政事务',
      status: 'ACTIVE',
      level: 1,
      sortOrder: 3,
    },
  });

  console.log('✅ Created 3 categories');

  // ============================================
  // 6. Create Admin User
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
      departmentId: adminDept.id,
      position: '系统管理员',
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
  // 7. Create Test Users
  // ============================================
  console.log('Creating test users...');

  const testUsers = [
    {
      username: 'department_admin',
      email: 'department_admin@example.com',
      password: 'admin123',
      firstName: '张',
      lastName: '管理',
      position: '技术部经理',
      department: techDept,
      role: adminRole,
    },
    {
      username: 'handler1',
      email: 'handler1@example.com',
      password: 'test123',
      firstName: '李',
      lastName: '处理',
      position: '技术支持',
      department: techDept,
      role: handlerRole,
    },
    {
      username: 'handler2',
      email: 'handler2@example.com',
      password: 'test123',
      firstName: '王',
      lastName: '工单',
      position: '客服专员',
      department: serviceDept,
      role: handlerRole,
    },
    {
      username: 'user1',
      email: 'user1@example.com',
      password: 'test123',
      firstName: '赵',
      lastName: '普通',
      position: '普通员工',
      department: adminDept,
      role: userRole,
    },
    {
      username: 'user2',
      email: 'user2@example.com',
      password: 'test123',
      firstName: '陈',
      lastName: '用户',
      position: '普通员工',
      department: adminDept,
      role: userRole,
    },
  ];

  const createdUsers: any[] = [adminUser];

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
        departmentId: testUser.department.id,
        position: testUser.position,
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

    createdUsers.push(user);
  }

  console.log('✅ Created test users');

  // ============================================
  // 8. Create Mock Todos
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
      where: { id: `${title}-todo` },
      update: {},
      create: {
        id: `${title}-todo`,
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

  // ============================================
  // 9. Create Mock Tickets
  // ============================================
  console.log('Creating mock tickets...');

  const ticketData = [
    {
      title: '电脑无法开机',
      description: '我的办公电脑按电源键后没有任何反应，电源指示灯也不亮',
      category: techCategory,
      priority: 'URGENT' as const,
      status: 'PROCESSING' as const,
      createdBy: createdUsers[3], // user1
      assignedTo: createdUsers[1], // handler1
    },
    {
      title: '会议室投影仪故障',
      description: 'A会议室的投影仪无法连接电脑，显示无信号',
      category: techCategory,
      priority: 'NORMAL' as const,
      status: 'WAIT_ASSIGN' as const,
      createdBy: createdUsers[4], // user2
      assignedTo: null,
    },
    {
      title: '申请办公用品',
      description: '需要申请A4纸2箱、签字笔10支',
      category: adminCategory,
      priority: 'NORMAL' as const,
      status: 'COMPLETED' as const,
      createdBy: createdUsers[3], // user1
      assignedTo: createdUsers[2], // handler2
    },
    {
      title: '空调温度调节问题',
      description: '办公区空调温度过低，希望调节到26度',
      category: facilityCategory,
      priority: 'NORMAL' as const,
      status: 'CLOSED' as const,
      createdBy: createdUsers[4], // user2
      assignedTo: createdUsers[2], // handler2
    },
    {
      title: '网络连接不稳定',
      description: '下午3点左右网络经常断连，影响工作',
      category: techCategory,
      priority: 'URGENT' as const,
      status: 'WAIT_ACCEPT' as const,
      createdBy: createdUsers[3], // user1
      assignedTo: createdUsers[1], // handler1
    },
  ];

  for (const ticket of ticketData) {
    // Generate ticket number
    const ticketNumber = `TK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;

    // Calculate deadline
    const hours = ticket.priority === 'URGENT' ? 4 : 24;
    const deadlineAt = new Date();
    deadlineAt.setHours(deadlineAt.getHours() + hours);

    const created = await prisma.ticket.upsert({
      where: { ticketNumber },
      update: {},
      create: {
        ticketNumber,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        categoryId: ticket.category.id,
        createdById: ticket.createdBy.id,
        assignedId: ticket.assignedTo?.id,
        deadlineAt,
        completedAt: ticket.status === 'COMPLETED' || ticket.status === 'CLOSED' ? new Date() : null,
        closedAt: ticket.status === 'CLOSED' ? new Date() : null,
      },
    });

    // Add some comments
    if (ticket.status !== 'WAIT_ASSIGN') {
      await prisma.comment.create({
        data: {
          content: '工单已创建，正在处理中',
          ticketId: created.id,
          userId: ticket.createdBy.id,
          commentType: 'USER',
        },
      });
    }

    // Add status history
    if (ticket.status !== 'WAIT_ASSIGN') {
      await prisma.statusHistory.create({
        data: {
          ticketId: created.id,
          fromStatus: 'WAIT_ASSIGN',
          toStatus: ticket.status,
          userId: adminUser.id,
          remark: '系统自动流转',
        },
      });
    }
  }

  console.log('✅ Created mock tickets');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Super Admin:');
  console.log('    - admin@example.com / admin123');
  console.log('  Department Admin:');
  console.log('    - department_admin@example.com / admin123');
  console.log('  Handlers:');
  console.log('    - handler1@example.com / test123');
  console.log('    - handler2@example.com / test123');
  console.log('  Users:');
  console.log('    - user1@example.com / test123');
  console.log('    - user2@example.com / test123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
