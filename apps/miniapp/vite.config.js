const { defineConfig } = require("vite");
const uni = require("@dcloudio/vite-plugin-uni").default;

// HBuilderX 预编译方案
// Tailwind CSS 通过 npx tailwindcss 预编译，Vite 直接使用编译后的 CSS
// 新增类名后运行: pnpm build:css

module.exports = defineConfig({
  plugins: [
    uni(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // 注入 uView Plus 的主题变量和 mixin（包含 @mixin flex）
        additionalData: `@import "uview-plus/theme.scss";`,
        // 使用 legacy API（更稳定）
        api: 'legacy',
        // 额外的配置
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
      },
    },
  },
});
