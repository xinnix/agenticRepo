# 小程序设计系统 - 有机现代风格

## 设计理念

本小程序采用 **有机现代** 设计风格，融合自然的有机形态与现代简约美学，创造出温暖、专业且富有层次感的用户体验。

### 核心设计原则

1. **自然有机** - 使用柔和的曲线、自然的配色和有机的形态
2. **现代简约** - 保持布局简洁、信息层次清晰
3. **温暖专业** - 用暖色调营造亲和力，同时保持商务专业感
4. **细节精致** - 注重微交互、动画和视觉细节

## 配色方案

### 主色调 - 陶土色系
```scss
--color-primary: #C67B5C;        // 陶土橙棕
--color-primary-light: #E8A882;  // 浅陶土
--color-primary-dark: #A85D3E;   // 深陶土
--color-primary-bg: rgba(198, 123, 92, 0.08); // 主色背景
```

### 背景色系
```scss
--nordic-bg-page: #F5F3EF;       // 页面背景 - 暖米色
--nordic-bg-card: #FFFEFB;       // 卡片背景 - 暖白色
--nordic-bg-input: #EBE8E1;      // 输入框背景 - 浅灰棕
--nordic-bg-elevated: #FFFFFF;   // 浮层背景
```

### 文本色系
```scss
--nordic-text-primary: #2C2A27;  // 主要文字 - 深暖灰
--nordic-text-secondary: #6B665F; // 次要文字 - 中暖灰
--nordic-text-tertiary: #A8A49C;  // 辅助文字 - 浅暖灰
```

### 自然莫兰迪强调色
```scss
--nordic-accent-sage: #9DB4A0;    // 鼠尾草绿
--nordic-accent-sand: #C4B0A0;    // 沙漠棕
--nordic-accent-rose: #D4A09A;    // 玫瑰粉
--nordic-accent-sky: #9CB4C4;     // 天空蓝
--nordic-accent-moss: #A8B088;    // 苔藓绿
--nordic-accent-clay: #C49088;    // 粘土橙
```

### 状态色 - 柔和大地版本
```scss
--nordic-success: #7BA37B;        // 成功 - 柔和绿
--nordic-warning: #C9A35C;        // 警告 - 柔和金棕
--nordic-error: #C47878;          // 错误 - 柔和红
--nordic-info: #7B9EC4;           // 信息 - 柔和蓝
```

## 圆角系统

```scss
rounded-nordic-sm { border-radius: 8rpx; }   // 小圆角
rounded-nordic-md { border-radius: 12rpx; }  // 中圆角
rounded-nordic-lg { border-radius: 16rpx; }  // 大圆角
rounded-nordic-xl { border-radius: 20rpx; }  // 超大圆角
rounded-nordic-2xl { border-radius: 24rpx; } // 特大圆角
```

**使用原则：**
- 按钮、输入框：`rounded-nordic-lg` (16rpx)
- 卡片：`rounded-nordic-2xl` (20rpx)
- 标签、徽章：`rounded-nordic-xl` (24rpx)
- 小元素：`rounded-nordic-sm` (8rpx)

## 阴影系统

```scss
shadow-nordic-sm {  // 微阴影 - 轻微浮起
  box-shadow: 0 2rpx 8rpx var(--nordic-shadow-subtle),
              0 1rpx 4rpx var(--nordic-shadow-subtle);
}

shadow-nordic-md {  // 中阴影 - 标准卡片
  box-shadow: 0 4rpx 16rpx var(--nordic-shadow-soft),
              0 2rpx 8rpx var(--nordic-shadow-subtle);
}

shadow-nordic-lg {  // 大阴影 - 模态框
  box-shadow: 0 8rpx 32rpx var(--nordic-shadow-medium),
              0 4rpx 16rpx var(--nordic-shadow-soft);
}

shadow-nordic-xl {  // 超大阴影 - 弹出层
  box-shadow: 0 16rpx 48rpx var(--nordic-shadow-medium),
              0 8rpx 24rpx var(--nordic-shadow-soft);
}
```

## 动画系统

### 按钮交互
```scss
.nordic-button-animate {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.nordic-button-animate:active {
  transform: scale(0.96);
}
```

### 卡片交互
```scss
.nordic-card-hover {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.nordic-card-hover:active {
  transform: translateY(2rpx) scale(0.99);
  box-shadow: 0 2rpx 12rpx var(--nordic-shadow-soft);
}
```

### 入场动画
```scss
// 淡入上浮
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 有机弹跳
@keyframes organic-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6rpx); }
}
```

### 交错延迟
用于列表项的渐入效果：
```scss
.animate-delay-100 { animation-delay: 0.1s; }
.animate-delay-200 { animation-delay: 0.2s; }
.animate-delay-300 { animation-delay: 0.3s; }
.animate-delay-400 { animation-delay: 0.4s; }
.animate-delay-500 { animation-delay: 0.5s; }
```

## 标签样式

### 基础标签
```scss
.nordic-tag {
  padding: 10rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 500;
  letter-spacing: 0.5rpx;
}
```

### 状态变体
```scss
.nordic-tag-primary { // 主色调
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
}

.nordic-tag-success { // 成功
  background: rgba(123, 163, 123, 0.12);
  color: #5C8B5C;
}

.nordic-tag-warning { // 警告
  background: rgba(201, 163, 92, 0.12);
  color: #9A7B4C;
}

.nordic-tag-error { // 错误
  background: rgba(196, 120, 120, 0.12);
  color: #A85C5C;
}

.nordic-tag-info { // 信息
  background: rgba(123, 158, 196, 0.12);
  color: #5C7BA8;
}
```

### 自然色调变体
```scss
.nordic-tag-sage { // 鼠尾草
  background: rgba(157, 180, 160, 0.12);
  color: #7A9B7C;
}

.nordic-tag-rose { // 玫瑰
  background: rgba(212, 160, 154, 0.12);
  color: #A87A78;
}

.nordic-tag-outline { // 轮廓
  background: transparent;
  border: 2rpx solid var(--nordic-border);
  color: var(--nordic-text-secondary);
}
```

## 图标系统

使用 Unicode 符号替代 emoji，保持专业性：

| 用途 | 图标 | 说明 |
|------|------|------|
| 分类 | ◆ | 菱形符号 |
| 时间 | ◷ | 时钟符号 |
| 状态 | ● | 圆点 |
| 添加 | + | 加号 |
| 更多 | › | 箭头 |
| 装饰 | ✦ | 星形 |

## 状态指示

### 状态圆点
用于显示工单状态的彩色圆点：
```scss
.status-dot-wait_assign { background: #C4B0A0; } // 待指派
.status-dot-wait_accept { background: #9CB4C4; } // 待接单
.status-dot-processing { background: #9DB4A0; } // 处理中
.status-dot-completed { background: #7BA37B; }  // 已完成
.status-dot-closed { background: #A8A49C; }     // 已关闭
```

### 优先级圆点
```scss
.priority-dot-urgent { background: #C47878; }    // 紧急
.priority-dot-normal { background: #9DB4A0; }   // 普通
```

## 渐变背景

```scss
// 主色调渐变
.bg-gradient-to-r {
  background: linear-gradient(135deg, #C67B5C 0%, #A85D3E 100%);
}

// 暖色渐变
.bg-gradient-warm {
  background: linear-gradient(135deg, #E8A882 0%, #C67B5C 50%, #A85D3E 100%);
}

// 有机渐变
.bg-gradient-organic {
  background: linear-gradient(145deg, #F5F3EF 0%, #EBE8E1 100%);
}

// 鼠尾草渐变
.bg-gradient-sage {
  background: linear-gradient(135deg, #9DB4A0 0%, #7BA37B 100%);
}
```

## 纹理效果

```scss
// 点状纹理
.bg-texture-dots {
  background-image: radial-gradient(circle, var(--nordic-border) 1px, transparent 1px);
  background-size: 24rpx 24rpx;
}

// 线条纹理
.bg-texture-lines {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 20rpx,
    rgba(198, 123, 92, 0.03) 20rpx,
    rgba(198, 123, 92, 0.03) 40rpx
  );
}
```

## 特效装饰

### 卡片装饰
```scss
.card-organic {
  position: relative;
  overflow: hidden;
}

.card-organic::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200rpx;
  height: 200rpx;
  background: radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%);
  opacity: 0.05;
  border-radius: 50%;
  pointer-events: none;
}
```

### 圆形装饰
```scss
.organic-blob {
  border-radius: 60% 40% 50% 50% / 50% 60% 40% 50%;
}

.organic-blob-2 {
  border-radius: 70% 30% 70% 30% / 30% 70% 30% 70%;
}
```

## 页面布局示例

### 卡片布局
```vue
<view class="bg-nordic-bg-card rounded-nordic-2xl shadow-nordic-md p-nordic-5 nordic-card-hover card-organic">
  <!-- 内容 -->
</view>
```

### 表单布局
```vue
<view class="min-h-screen bg-nordic-bg-page p-nordic-6 bg-texture-dots">
  <view class="bg-nordic-bg-card rounded-nordic-2xl shadow-nordic-md p-nordic-6 animate-fade-in-up">
    <!-- 表单内容 -->
  </view>
</view>
```

### 列表布局
```vue
<scroll-view class="flex-1 p-nordic-6" scroll-y>
  <view
    v-for="(item, index) in list"
    :key="item.id"
    class="bg-nordic-bg-card rounded-nordic-2xl shadow-nordic-md p-nordic-5 mb-nordic-5 nordic-card-hover card-organic animate-fade-in-up"
    :style="{ animationDelay: `${(index % 5) * 0.05}s` }"
  >
    <!-- 列表项内容 -->
  </view>
</scroll-view>
```

## 组件规范

### 按钮
- 使用 `u-button` 组件
- 主要按钮：`type="primary"`
- 大小：`size="large"`
- 圆角：自动应用 `rounded-nordic-lg`

### 输入框
- 使用 `u-input` 和 `u-textarea`
- 背景色：`#EBE8E1`
- 圆角：`rounded-nordic-lg`
- 高度：`80rpx`

### 标签
- 使用自定义 `nordic-tag` 类
- 根据状态选择对应变体
- 圆角：`24rpx`

### 卡片
- 背景色：`#FFFEFB`
- 圆角：`20rpx`
- 阴影：`shadow-nordic-md`
- 内边距：`p-nordic-5` (32rpx)

## 设计建议

### 保持一致性
- 使用统一的间距系统（`nordic-*` 类）
- 遵循配色方案，不要随意添加新颜色
- 使用统一的圆角和阴影

### 视觉层次
- 使用颜色深浅区分重要性
- 利用阴影营造空间感
- 通过间距建立信息分组

### 微交互
- 按钮点击：scale(0.96)
- 卡片点击：translateY(2rpx) + scale(0.99)
- 悬停效果：阴影增强

### 动画使用
- 列表入场：`animate-fade-in-up` + 交错延迟
- 按钮交互：`nordic-button-animate`
- 加载状态：使用有机弹跳动画

## 更新日志

### v1.0.0 - 有机现代风格
- 从北欧极简风格重构为有机现代风格
- 更新主色调为陶土色系 (#C67B5C)
- 引入自然莫兰迪强调色
- 新增纹理背景和装饰效果
- 优化动画系统，使用 cubic-bezier 缓动
- 移除 emoji 图标，改用专业符号
- 新增状态圆点指示器
- 优化阴影和渐变效果
