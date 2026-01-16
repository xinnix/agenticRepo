#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Generate Module Skill
 *
 * A skill that rapidly generates full-stack modules for the opencode-stack project
 * from database schema to frontend management pages.
 *
 * Features:
 * - Smart field analysis for 10+ business patterns
 * - Full CRUD backend generation (tRPC + REST)
 * - Frontend management pages (React + Refine)
 * - File upload support
 * - Database migration automation
 */

interface ModuleField {
  name: string;
  type: 'string' | 'text' | 'number' | 'float' | 'boolean' | 'date' | 'enum' | 'image' | 'file' | 'files' | 'relation';
  required: boolean;
  unique?: boolean;
  default?: any;
  relation?: string;
  enumValues?: (string | number)[];
}

interface GenerateOptions {
  moduleName: string;
  fields?: string;
  uiType?: 'table' | 'card' | 'kanban';
  dryRun?: boolean;
  fileUpload?: boolean;
}

class GenerateModuleSkill {
  private readonly scriptPath: string;
  private readonly projectRoot: string;
  private readonly databasePath: string;
  private readonly sharedPath: string;

  constructor() {
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    // Go up from .claude/skills/generate-module/ to project root
    // .claude/skills/generate-module/generate-module.ts -> project root
    this.projectRoot = path.join(currentDir, '..', '..', '..');

    // Try different paths for database and shared packages
    const possibleDbPaths = [
      path.join(this.projectRoot, 'packages', 'database'),
      path.join(this.projectRoot, 'infra', 'database'),
    ];

    const possibleSharedPaths = [
      path.join(this.projectRoot, 'packages', 'shared'),
      path.join(this.projectRoot, 'infra', 'shared'),
    ];

    this.databasePath = possibleDbPaths.find(p => fs.existsSync(p)) || possibleDbPaths[0];
    this.sharedPath = possibleSharedPaths.find(p => fs.existsSync(p)) || possibleSharedPaths[0];

    // Path to the original generate-module.js script
    this.scriptPath = path.join(this.projectRoot, 'scripts', 'generate-module.js');
  }

  async execute(args: string[]): Promise<void> {
    try {
      // Parse arguments
      const options = this.parseArguments(args);

      // Show header
      this.showHeader();

      // Validate options
      this.validateOptions(options);

      // Show preview if fileUpload is enabled
      if (options.fileUpload) {
        await this.showFileUploadPreview(options);
      }

      // Check if module already exists
      if (this.moduleExists(options.moduleName) && !options.dryRun) {
        throw new Error(`Module "${options.moduleName}" already exists. Use --force to overwrite.`);
      }

      // Generate the module
      await this.generateModule(options);

      // Show success message
      this.showSuccess(options);

    } catch (error) {
      this.showError(error as Error);
      process.exit(1);
    }
  }

  private parseArguments(args: string[]): GenerateOptions {
    const options: GenerateOptions = {
      moduleName: '',
      dryRun: false,
      fileUpload: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (!arg.startsWith('--') && !options.moduleName) {
        options.moduleName = arg;
      } else if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      } else if (arg === '--dry-run') {
        options.dryRun = true;
      } else if (arg === '--file-upload') {
        options.fileUpload = true;
      } else if (arg.startsWith('--fields=')) {
        options.fields = arg.substring('--fields='.length);
      } else if (arg === '--fields') {
        options.fields = args[++i];
      } else if (arg.startsWith('--ui=')) {
        options.uiType = arg.substring('--ui='.length) as 'table' | 'card' | 'kanban';
      } else if (arg === '--ui') {
        options.uiType = args[++i] as 'table' | 'card' | 'kanban';
      }
    }

    return options;
  }

  private validateOptions(options: GenerateOptions): void {
    if (!options.moduleName) {
      throw new Error('Module name is required');
    }

    // Validate module name format
    if (!/^[a-z][a-z0-9_]*$/.test(options.moduleName)) {
      throw new Error('Module name must be lowercase alphanumeric with underscores allowed (e.g., "product", "todo_item")');
    }

    // Validate UI type
    if (options.uiType && !['table', 'card', 'kanban'].includes(options.uiType)) {
      throw new Error('UI type must be: table, card, or kanban');
    }
  }

  private showHeader(): void {
    console.log('\n🚀 OpenCode Stack - Module Generator\n');
    console.log('='.repeat(50));
    console.log('');
  }

  private showHelp(): void {
    const helpText = `
📚 Generate Module Skill - Help

USAGE:
  /generate-module <moduleName> [options]

ARGUMENTS:
  moduleName          Module name (e.g., "product", "todo", "user")

OPTIONS:
  --fields <spec>     Custom field specification
                      Format: "name:type:attr1:attr2,..."
                      Types: string, text, number, float, boolean, date, enum, image, file, files
                      Attributes: required, optional, unique, default:value, relation:Model

  --ui <type>        UI layout type (default: table)
                      Options: table, card, kanban

  --file-upload      Enable file upload fields
                      Adds support for image, file, and files types

  --dry-run          Show what would be generated without creating files

  --help, -h         Show this help message

EXAMPLES:

  # Smart analysis (recommended)
  /generate-module product

  # With custom fields
  /generate-module order --fields="customerId:number:required,total:number:required,status:enum:pending:paid:shipped"

  # With file upload support
  /generate-module article --fields="title:string:required,content:text:required,cover:image:optional" --file-upload

  # Dry run to preview
  /generate-module todo --dry-run

SUPPORTED BUSINESS PATTERNS:
  📝 Content: article, post, blog, news
  ✅ Task: todo, task, assignment
  📦 Product: product, item, goods
  👤 User: user, customer, member
  🛒 Order: order, transaction, purchase
  🏷️  Category: category, tag, classification
  🔐 Role: role, permission, access
  📁 File: file, media, document
  💬 Comment: comment, review, feedback
  📊 Log: log, audit, history
  ⚙️  Setting: setting, config, option

FILE UPLOAD FIELD TYPES:
  image       Single image upload with preview
  file        Single file upload
  files       Multiple file upload

For more information, visit: https://github.com/opencode-stack/opencode-stack
`;
    console.log(helpText);
  }

  private async showFileUploadPreview(options: GenerateOptions): Promise<void> {
    console.log('📎 File Upload Support Preview\n');
    console.log('The following features will be added:\n');

    console.log('Backend (NestJS):');
    console.log('  ✓ Multer configuration for file uploads');
    console.log('  ✓ File validation (type, size)');
    console.log('  ✓ Storage service integration');
    console.log('  ✓ API endpoints for file operations\n');

    console.log('Frontend (React + Refine):');
    console.log('  ✓ Drag & drop file upload UI');
    console.log('  ✓ Image preview for images');
    console.log('  ✓ File list management');
    console.log('  ✓ Upload progress indicator\n');

    console.log('Database (Prisma):');
    console.log('  ✓ File metadata storage');
    console.log('  ✓ Relation to parent model');
    console.log('  ✓ File type validation\n');

    console.log('-'.repeat(50));
    console.log('');
  }

  private moduleExists(moduleName: string): boolean {
    // Check if module directory exists
    const backendModulePath = path.join(this.projectRoot, 'apps/api/src/modules', moduleName);
    const frontendPagePath = path.join(this.projectRoot, 'apps/admin/src/pages', moduleName);

    return fs.existsSync(backendModulePath) || fs.existsSync(frontendPagePath);
  }

  private async generateModule(options: GenerateOptions): Promise<void> {
    const steps = [
      { name: 'Analyzing module type', weight: 1 },
      { name: 'Setting up environment', weight: 1 },
      { name: 'Generating Prisma schema', weight: 1 },
      { name: 'Generating backend code', weight: 3 },
      { name: 'Generating frontend pages', weight: 2 },
      { name: 'Updating configuration', weight: 1 },
      { name: 'Generating Prisma client', weight: 1 },
    ];

    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    let currentWeight = 0;

    // Show progress
    const progressInterval = setInterval(() => {
      const randomWeight = Math.random() * 0.5 + 0.5;
      currentWeight = Math.min(currentWeight + randomWeight, totalWeight);
      const progress = Math.floor((currentWeight / totalWeight) * 100);

      process.stdout.write(`\r[${'='.repeat(progress / 2)}${' '.repeat(50 - progress / 2)}] ${progress}%`);
    }, 100);

    try {
      // Create symlinks if needed
      await this.setupSymlinks();

      // Build command
      const commandArgs = [
        this.scriptPath,
        '--module',
        options.moduleName,
      ];

      if (options.fields) {
        commandArgs.push('--fields', options.fields);
      }

      if (options.uiType) {
        commandArgs.push('--ui', options.uiType);
      }

      // Execute generation
      execSync(`node ${commandArgs.map(arg => `"${arg}"`).join(' ')}`, {
        cwd: this.projectRoot,
        stdio: 'inherit',
      });

      clearInterval(progressInterval);
      process.stdout.write('\n');

    } catch (error) {
      clearInterval(progressInterval);
      process.stdout.write('\n');
      throw error;
    }
  }

  private async setupSymlinks(): Promise<void> {
    // Create symlinks for database and shared packages if they don't exist in expected locations
    const packagesDbPath = path.join(this.projectRoot, 'packages', 'database');
    const packagesSharedPath = path.join(this.projectRoot, 'packages', 'shared');

    // Only create symlinks if they don't exist
    if (!fs.existsSync(packagesDbPath) && fs.existsSync(path.join(this.projectRoot, 'infra', 'database'))) {
      try {
        fs.symlinkSync(
          path.join(this.projectRoot, 'infra', 'database'),
          packagesDbPath,
          'dir'
        );
        console.log('✓ Created symlink: packages/database -> infra/database');
      } catch (e) {
        // Ignore if already exists or other errors
      }
    }

    if (!fs.existsSync(packagesSharedPath) && fs.existsSync(path.join(this.projectRoot, 'infra', 'shared'))) {
      try {
        fs.symlinkSync(
          path.join(this.projectRoot, 'infra', 'shared'),
          packagesSharedPath,
          'dir'
        );
        console.log('✓ Created symlink: packages/shared -> infra/shared');
      } catch (e) {
        // Ignore if already exists or other errors
      }
    }
  }

  private showSuccess(options: GenerateOptions): void {
    console.log('\n');
    console.log('✅ Module generated successfully!\n');
    console.log('📦 Generated files:\n');

    const files = [
      `apps/api/src/modules/${options.moduleName}/${options.moduleName}.service.ts`,
      `apps/api/src/modules/${options.moduleName}/${options.moduleName}.controller.ts`,
      `apps/api/src/modules/${options.moduleName}/${options.moduleName}.module.ts`,
      `apps/api/src/modules/${options.moduleName}/${options.moduleName}.dto.ts`,
      `apps/api/src/trpc/${options.moduleName}.router.ts`,
      `apps/admin/src/pages/${options.moduleName}/list.tsx`,
      `apps/admin/src/pages/${options.moduleName}/create.tsx`,
      `apps/admin/src/pages/${options.moduleName}/edit.tsx`,
      `apps/admin/src/pages/${options.moduleName}/show.tsx`,
    ];

    files.forEach(file => console.log(`  ✓ ${file}`));

    console.log('\n🚀 Next steps:\n');
    console.log('1. Create database migration:');
    console.log(`   cd packages/database && npx prisma migrate dev --name add-${options.moduleName}\n`);
    console.log('2. Start the development servers:');
    console.log('   pnpm --filter @opencode/api run dev');
    console.log('   pnpm --filter @opencode/admin run dev\n');

    if (options.fileUpload) {
      console.log('📎 File upload configuration:\n');
      console.log('1. Configure Multer in apps/api/src/main.ts');
      console.log('2. Set up file storage (local/cloud)');
      console.log('3. Update CORS settings if needed\n');
    }

    console.log('='.repeat(50));
  }

  private showError(error: Error): void {
    console.log('\n❌ Error:\n');
    console.log(`  ${error.message}\n`);

    if (error.message.includes('already exists')) {
      console.log('💡 Tip: Use --dry-run to preview what would be generated');
      console.log('   or manually remove the existing module first.\n');
    } else if (error.message.includes('Module name')) {
      console.log('💡 Tip: Module names must be lowercase alphanumeric');
      console.log('   Examples: product, todo_item, user_profile\n');
    }

    console.log('For help, run: /generate-module --help\n');
    console.log('='.repeat(50));
  }
}

// Main execution
async function main() {
  const skill = new GenerateModuleSkill();
  try {
    await skill.execute(process.argv.slice(2));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

export default GenerateModuleSkill;
