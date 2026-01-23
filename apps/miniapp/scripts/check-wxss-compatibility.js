/**
 * WXSS兼容性检查工具
 * 检查Vue文件中的样式是否兼容WXSS
 */

const fs = require('fs');
const path = require('path');

// 搜索目录
const searchDir = path.join(__dirname, '../components');

// 存储找到的问题
const issues = [];

// 不支持的CSS属性和选择器
const unsupportedPatterns = [
  {
    pattern: /(^|[\s:;,>+~])\*/g, // 通用选择器
    description: '通用选择器 * 不被WXSS支持',
    severity: 'error'
  },
  {
    pattern: /([^-a-zA-Z0-9_])vh([^-a-zA-Z0-9_]|$)/g, // vh单位
    description: '视口高度单位 vh 不被WXSS支持',
    severity: 'error'
  },
  {
    pattern: /([^-a-zA-Z0-9_])vw([^-a-zA-Z0-9_]|$)/g, // vw单位
    description: '视口宽度单位 vw 不被WXSS支持',
    severity: 'error'
  },
  {
    pattern: /([^-a-zA-Z0-9_])vmin([^-a-zA-Z0-9_]|$)/g, // vmin单位
    description: '视口最小单位 vmin 不被WXSS支持',
    severity: 'error'
  },
  {
    pattern: /([^-a-zA-Z0-9_])vmax([^-a-zA-Z0-9_]|$)/g, // vmax单位
    description: '视口最大单位 vmax 不被WXSS支持',
    severity: 'error'
  },
  {
    pattern: /@media/g, // 媒体查询
    description: '@media 媒体查询在WXSS中支持有限',
    severity: 'warning'
  },
  {
    pattern: /:root/g, // :root选择器
    description: ':root 选择器不被WXSS支持',
    severity: 'warning'
  }
];

/**
 * 检查单个Vue文件
 */
function checkVueFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 提取style标签内容
    const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);

    if (!styleMatches) {
      return;
    }

    styleMatches.forEach((styleContent, index) => {
      // 提取样式内容（去除<style>标签）
      const cleanStyle = styleContent.replace(/<style[^>]*>/i, '').replace(/<\/style>/i, '');

      // 移除注释以避免误报
      const styleWithoutComments = cleanStyle
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除 /* */ 注释
        .replace(/\/\/.*$/gm, ''); // 移除 // 注释

      // 检查每个不支持的模式
      unsupportedPatterns.forEach(({ pattern, description, severity }) => {
        const matches = styleWithoutComments.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = getLineNumber(content, match);
            issues.push({
              file: path.relative(__dirname, filePath),
              line: lineNumber,
              issue: description,
              found: match,
              severity,
              styleIndex: index
            });
          });
        }
      });
    });

  } catch (err) {
    console.error(`读取文件失败: ${filePath}`, err.message);
  }
}

/**
 * 获取匹配内容的行号
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
    } else if (stat.isFile() && file.endsWith('.vue')) {
      checkVueFile(filePath);
    }
  });
}

// 执行检查
console.log('🔍 开始检查WXSS兼容性...\n');

searchDirectory(searchDir);

// 按严重程度排序
issues.sort((a, b) => {
  const severityOrder = { error: 0, warning: 1, info: 2 };
  return severityOrder[a.severity] - severityOrder[b.severity];
});

// 输出结果
if (issues.length === 0) {
  console.log('✅ 所有文件都符合WXSS兼容性要求！\n');
} else {
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  console.log(`❌ 发现 ${issues.length} 个兼容性问题：`);
  console.log(`   - 错误: ${errorCount}`);
  console.log(`   - 警告: ${warningCount}\n`);

  issues.forEach(issue => {
    const icon = issue.severity === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${issue.file}:${issue.line}`);
    console.log(`   ${issue.issue}`);
    console.log(`   发现: ${issue.found}\n`);
  });
}

console.log('\n📋 WXSS兼容性建议：');
console.log('1. 避免使用通用选择器 *');
console.log('2. 不使用视口单位 (vh, vw, vmin, vmax)');
console.log('3. 谨慎使用 @media 查询');
console.log('4. 不使用 :root 选择器');
console.log('5. 使用固定单位 (rpx, px) 替代视口单位\n');

if (errorCount > 0) {
  console.log('⚠️  请修复所有错误后再进行编译。\n');
  process.exit(1);
} else {
  console.log('✅ 可以安全进行编译。\n');
  process.exit(0);
}
