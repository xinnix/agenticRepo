# FeedbackHub MiniApp - 小程序

后勤反馈系统小程序，采用**北欧简约风格**设计，基于 Tailwind CSS v3 构建。

## 🎨 设计系统

### 色彩系统（莫兰迪色系）

- **主色调**: 莫兰迪蓝灰 (#7B9EA8)
- **辅助色**: 温暖粉 (#D4A5A5)、鼠尾草绿 (#A8B5A0)、沙色 (#C4B7A6)、玫瑰色 (#CFA5A5)
- **背景色**: 温暖米白 (#FAF9F7)
- **文字色**: 棕灰色系 (#3D3A36, #7B7670, #A8A49E)

### 设计特点

- ✨ 大量留白，呼吸感强
- 🔘 大圆角设计（12-24px）
- 💡 极轻阴影，层次微妙
- 🎯 清晰的信息层级

## 🛠️ 技术栈

- **框架**: uni-app + Vue 3
- **样式**: Tailwind CSS v3.4.17 + weapp-tailwindcss v3.0.0
- **构建**: Vite
- **平台**: 微信小程序

## 📦 安装依赖

```bash
pnpm install
```

## 🚀 开发

使用 HBuilderX 打开项目，点击运行即可。

## 📝 配置说明

### Tailwind 配置

- 自定义 nordic-* 主题色彩
- 响应式设计
- WXSS 兼容性优化

### 主要文件

- `tailwind.config.js` - Tailwind 配置
- `postcss.config.js` - PostCSS 配置
- `vite.config.js` - Vite 配置
- `styles/tailwind-base.css` - 样式入口
- `App.vue` - 全局样式引入

## 📚 可用样式类

### 背景色
- `bg-nordic-bg-page` - 页面背景
- `bg-nordic-bg-card` - 卡片背景
- `bg-primary` - 主色调

### 文字色
- `text-nordic-text-primary` - 主文字
- `text-nordic-text-secondary` - 次要文字
- `text-nordic-accent-sage` - 成功色

### 圆角
- `rounded-nordic-sm` - 小圆角 (12px)
- `rounded-nordic-md` - 中圆角 (16px)
- `rounded-nordic-lg` - 大圆角 (20px)
- `rounded-nordic-xl` - 超大圆角 (24px)

### 间距
- `p-nordic-6` - 内边距 24px
- `m-nordic-6` - 外边距 24px
- `gap-nordic-2` - 间距 8px

### 阴影
- `shadow-nordic-sm` - 小阴影
- `shadow-nordic-md` - 中阴影
- `shadow-nordic-xl` - 大阴影

## 🔧 开发说明

### 样式编写规范

1. 使用 Tailwind 类名优先
2. 自定义nordic-*样式保持一致性
3. 避免直接写内联样式

### 页面结构示例

```vue
<template>
  <view class="min-h-screen bg-nordic-bg-page p-nordic-6">
    <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6">
      <text class="text-nordic-h2 text-nordic-text-primary">
        标题
      </text>
    </view>
  </view>
</template>
```

## 📄 许可证

ISC
