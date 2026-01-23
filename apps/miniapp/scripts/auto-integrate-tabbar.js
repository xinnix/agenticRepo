/**
 * 自动集成TabBar到所有页面
 * 快速修复脚本
 */

const fs = require('fs');
const path = require('path');

// 需要集成的页面（排除详情页）
const pagesToIntegrate = [
  'pages/handler/dashboard/index.vue',
  'pages/handler/task-pool/index.vue',
  'pages/handler/my-tasks/index.vue'
];

// Tab ID映射
const tabIdMapping = {
  'pages/handler/dashboard/index.vue': 'dashboard',
  'pages/handler/task-pool/index.vue': 'task-pool',
  'pages/handler/my-tasks/index.vue': 'my-tasks'
};

/**
 * 集成PageLayout到页面
 */
function integratePageLayout(pagePath) {
  console.log(`🔧 正在集成: ${pagePath}`);

  try {
    const fullPath = path.join(__dirname, '../', pagePath);
    let content = fs.readFileSync(fullPath, 'utf-8');

    // 检查是否已集成
    if (content.includes('import PageLayout')) {
      console.log(`✅ 已集成: ${pagePath}`);
      return;
    }

    // 1. 修改template - 添加PageLayout包裹
    if (!content.includes('<PageLayout>')) {
      // 在第一个<view>前添加PageLayout
      content = content.replace(
        /<template>\s*\n\s*<view/,
        `<template>\n  <PageLayout>\n    <view`
      );

      // 在最后的</view>后添加PageLayout闭合
      content = content.replace(
        /<\/view>\s*\n<\/template>/,
        `</view>\n  </PageLayout>\n</template>`
      );
      console.log(`✅ 修改template: ${pagePath}`);
    }

    // 2. 修改script - 添加import和onShow
    if (!content.includes('import PageLayout')) {
      // 查找import部分并添加新的import
      content = content.replace(
        /(import.*?from.*?['"][^'"]*['"];?)/,
        `$1\nimport { onShow } from '@dcloudio/uni-app';\nimport { useTabBarStore } from '@/store/modules/tabbar';\nimport { useTabBarUpdate } from '@/composables/useTabBarUpdate';\nimport PageLayout from '@/components/PageLayout.vue';`
      );

      // 查找store声明并添加
      content = content.replace(
        /(const \w+Store = use\w+Store\(\))/,
        `$1;\nconst tabBarStore = useTabBarStore();\nconst { updateTabBarSelected } = useTabBarUpdate();`
      );

      // 查找onMounted并添加onShow
      content = content.replace(
        /(onMounted\(\) => \{)/,
        `onShow(() => {\n  const pages = uni.getCurrentPages()\n  if (pages.length > 0) {\n    const currentPage = pages[pages.length - 1]\n    updateTabBarSelected(\`/\${currentPage.route}\`)\n  }\n})\n\n$1`
      );

      console.log(`✅ 修改script: ${pagePath}`);
    }

    // 写入文件
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ 成功集成: ${pagePath}\n`);

  } catch (error) {
    console.error(`❌ 集成失败: ${pagePath}`, error.message);
  }
}

// 执行集成
console.log('🚀 开始自动集成TabBar到页面...\n');

pagesToIntegrate.forEach(page => {
  integratePageLayout(page);
});

console.log('🎉 自动集成完成！');
