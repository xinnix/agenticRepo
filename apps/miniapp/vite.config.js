const { defineConfig } = require("vite");
const uni = require("@dcloudio/vite-plugin-uni").default;
const path = require("path");

module.exports = defineConfig({
  plugins: [
    uni(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/store': path.resolve(__dirname, './store'),
      '@/api': path.resolve(__dirname, './api'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/composables': path.resolve(__dirname, './composables'),
      '@/uni_modules': path.resolve(__dirname, './uni_modules'),
      '@/styles': path.resolve(__dirname, './styles'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'legacy',
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        // 配置全局变量路径
        importer(url, prev) {
          // 确保 @ 别名正确解析
          if (url.startsWith('@/')) {
            const resolvedPath = path.resolve(__dirname, url.slice(2));
            return {
              resolved: resolvedPath,
            };
          }
          // 处理 uview 组件内的 theme.scss 导入
          if (url.includes('uview-next/theme.scss')) {
            const resolvedPath = path.resolve(__dirname, 'uni_modules/uview-next/theme.scss');
            return {
              resolved: resolvedPath,
            };
          }
          return null;
        },
      },
    },
  },
});
