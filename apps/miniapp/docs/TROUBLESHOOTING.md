# 问题排查与解决方案

## 遇到的问题

### 1. WXSS编译错误：`unexpected token ';'`

**原因**：WXSS不支持`@tailwind`指令

**解决方案**：
- 移除了`@tailwind base/components/utilities`指令
- 改用预编译的CSS文件（`styles/compiled.css`）
- 所有Tailwind类都被手动编译为WXSS兼容的CSS

### 2. WXML编译错误：`unexpected character '{'`

**原因**：weapp-tailwindcss插件在处理Vue模板时删除了引号

**解决方案**：
- 暂时禁用weapp-tailwindcss插件
- 使用预编译的Tailwind CSS替代动态转换
- 所有必要的样式类都已在`compiled.css`中定义

### 3. Tailwind类名不生效

**解决方案**：
- 使用预编译CSS而不是动态转换
- 手动定义所有使用的Tailwind类
- 确保类名与Vue模板中的class属性匹配

## 当前配置

### 已移除的配置
- weapp-tailwindcss插件（暂时禁用）
- @tailwind指令
- 动态Tailwind类转换

### 当前方案
- 预编译CSS文件：`styles/compiled.css`
- 包含所有必要的Tailwind类
- WXSS完全兼容

## 可用的样式类

所有在页面中使用的Tailwind类都已在`compiled.css`中定义，包括：

### 布局类
- `flex`, `flex-col`, `flex-1`
- `items-center`, `justify-center`
- `grid`, `grid-cols-2`

### 背景色类
- `bg-nordic-bg-page`
- `bg-nordic-bg-card`
- `bg-primary`
- `bg-primary-bg`

### 文字色类
- `text-nordic-text-primary`
- `text-nordic-text-secondary`
- `text-primary`
- `text-white`

### 尺寸类
- `text-nordic-h2`, `text-nordic-h3`
- `text-nordic-lg`, `text-nordic-base`
- `text-nordic-sm`, `text-nordic-xs`

### 间距类
- `p-nordic-6`, `m-nordic-6`
- `gap-nordic-3`
- `mb-nordic-6`, `mt-nordic-6`

### 圆角类
- `rounded-nordic-sm`
- `rounded-nordic-md`
- `rounded-nordic-lg`
- `rounded-nordic-xl`

### 阴影类
- `shadow-nordic-sm`
- `shadow-nordic-md`
- `shadow-nordic-xl`

## 如何重新启用weapp-tailwindcss

如果未来需要重新启用插件，请：

1. 安装兼容版本的依赖：
   ```bash
   pnpm add -D tailwindcss@3.4.17 weapp-tailwindcss@3.0.0
   ```

2. 恢复vite.config.js配置
3. 恢复Tailwind配置文件
4. 测试确保不破坏WXML引号

## 注意事项

- 微信小程序的WXSS对CSS语法支持有限
- 避免使用：`@`指令、`:hover`等伪类、`/`透明度修饰符
- 使用预编译方案可以避免大部分兼容性问题
- 保持样式简单，优先使用基础CSS属性
