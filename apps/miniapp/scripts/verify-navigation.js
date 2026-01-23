/**
 * 验证导航修复脚本
 * 检查项目中是否还有switchTab的使用
 */

const fs = require('fs');
const path = require('path');

// 搜索目录
const searchDir = path.join(__dirname, '../pages');

// 存储找到的问题
const issues = [];

/**
 * 递归搜索文件
 */
function searchDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过node_modules等目录
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        searchDirectory(filePath);
      }
    } else if (stat.isFile()) {
      // 只检查.vue和.ts文件
      if (file.endsWith('.vue') || file.endsWith('.ts')) {
        checkFile(filePath);
      }
    }
  });
}

/**
 * 检查单个文件
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检查是否包含switchTab
    if (content.includes('uni.switchTab')) {
      issues.push({
        file: filePath,
        type: 'switchTab',
        line: getLineNumber(content, 'uni.switchTab')
      });
    }
  } catch (err) {
    console.error(`读取文件失败: ${filePath}`, err.message);
  }
}

/**
 * 获取行号
 */
function getLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return -1;
}

// 执行搜索
console.log('🔍 开始验证导航修复...\n');
searchDirectory(searchDir);

// 输出结果
if (issues.length === 0) {
  console.log('✅ 验证通过！所有switchTab调用已修复。\n');
} else {
  console.log('❌ 发现问题！以下文件仍包含switchTab调用：\n');
  issues.forEach(issue => {
    console.log(`📄 ${issue.file}:${issue.line}`);
    console.log(`   类型: ${issue.type}\n`);
  });
}

console.log('\n📋 修复指南：');
console.log('1. 将 uni.switchTab 替换为 navigateTo()');
console.log('2. 导入 navigateTo: import { navigateTo } from "@/utils/navigation"');
console.log('3. 使用: navigateTo("/pages/xxx/index")');
console.log('\n');

process.exit(issues.length > 0 ? 1 : 0);
