# TabBar集成指南（官方推荐方式）

## 概述

本指南基于微信小程序官方文档，详细说明如何在各个页面中集成自定义TabBar组件，确保所有Tab页面都能正确显示动态TabBar。

**重要**：我们使用官方推荐的实现方式，包括 `cover-view`、`cover-image` 和 `getTabBar` API。

## 官方推荐方式

### 关键特点
- ✅ 使用 `cover-view` + `cover-image` 组件
- ✅ 通过 `uni.getCurrentTabBar()` 更新选中态
- ✅ 保留完整的 tabBar 配置（`custom: true`）
- ✅ 支持角色动态切换

### pages.json 配置
```json
{
  "tabBar": {
    "custom": true,
    "list": [
      // 完整的tab页配置
    ]
  }
}
```

## 已完成的集成

### ✅ 已集成的页面

1. **我的工单页面** (`/pages/user/my-tickets/index.vue`)
   - ✅ 添加了PageLayout组件
   - ✅ 集成了TabBar状态管理
   - ✅ 添加了onShow生命周期钩子

## 需要集成的页面

### 待集成的Tab页面

#### 1. 提交反馈页面 (`/pages/user/submit/index.vue`)

**需要添加的修改：**

```vue
<template>
  <PageLayout>
    <!-- 现有内容保持不变 -->
    <view class="min-h-screen bg-nordic-bg-page p-nordic-6">
      <!-- ... 现有代码 ... -->
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
// 添加导入
import PageLayout from '@/components/PageLayout.vue';
import { useTabBarStore } from '@/store/modules/tabbar';
import { onShow } from '@dcloudio/uni-app';

const tabBarStore = useTabBarStore();

// 页面显示时设置Tab状态
onShow(() => {
  tabBarStore.setActiveTab('submit');
});
</script>
```

#### 2. 工作台页面 (`/pages/handler/dashboard/index.vue`)

```vue
<template>
  <PageLayout>
    <!-- 现有内容保持不变 -->
    <view class="min-h-screen bg-nordic-bg-page">
      <!-- ... 现有代码 ... -->
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue';
import { useTabBarStore } from '@/store/modules/tabbar';
import { onShow } from '@dcloudio/uni-app';

const tabBarStore = useTabBarStore();

onShow(() => {
  tabBarStore.setActiveTab('dashboard');
});
</script>
```

#### 3. 待接单池页面 (`/pages/handler/task-pool/index.vue`)

```vue
<template>
  <PageLayout>
    <!-- 现有内容保持不变 -->
    <view class="min-h-screen bg-nordic-bg-page">
      <!-- ... 现有代码 ... -->
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue';
import { useTabBarStore } from '@/store/modules/tabbar';
import { onShow } from '@dcloudio/uni-app';

const tabBarStore = useTabBarStore();

onShow(() => {
  tabBarStore.setActiveTab('task-pool');
});
</script>
```

#### 4. 我的任务页面 (`/pages/handler/my-tasks/index.vue`)

```vue
<template>
  <PageLayout>
    <!-- 现有内容保持不变 -->
    <view class="min-h-screen bg-nordic-bg-page">
      <!-- ... 现有代码 ... -->
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue';
import { useTabBarStore } from '@/store/modules/tabbar';
import { onShow } from '@dcloudio/uni-app';

const tabBarStore = useTabBarStore();

onShow(() => {
  tabBarStore.setActiveTab('my-tasks');
});
</script>
```

#### 5. 个人中心页面 (`/pages/common/profile/index.vue`)

```vue
<template>
  <PageLayout>
    <!-- 现有内容保持不变 -->
    <view class="min-h-screen bg-nordic-bg-page">
      <!-- ... 现有代码 ... -->
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue';
import { useTabBarStore } from '@/store/modules/tabbar';
import { onShow } from '@dcloudio/uni-app';

const tabBarStore = useTabBarStore();

onShow(() => {
  tabBarStore.setActiveTab('profile');
});
</script>
```

## 非Tab页面（无需集成）

以下页面不需要集成PageLayout，因为它们不是Tab页面：

- `/pages/index/index` - 启动页
- `/pages/auth/login/index` - 登录页
- `/pages/user/ticket-detail/index` - 工单详情页
- `/pages/user/rate/index` - 评价页
- `/pages/handler/task-detail/index` - 任务详情页

## 官方推荐的使用方式

### 1. 页面中更新选中态（官方方式）

在每个tab页面的 `onShow` 生命周期中添加：

```typescript
import { useTabBarUpdate } from '@/composables/useTabBarUpdate'
import { onShow } from '@dcloudio/uni-app'

const { updateTabBarSelected } = useTabBarUpdate()

onShow(() => {
  // 获取当前页面路径
  const pages = uni.getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    updateTabBarSelected(`/${currentPage.route}`)
  }
})
```

### 2. TabBar组件使用

在页面中直接使用，无需手动处理点击：

```vue
<template>
  <PageLayout>
    <!-- 页面内容 -->
    <view class="content">
      <!-- 您的内容 -->
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
</script>
```

### 3. 角色切换

状态管理自动处理，无需手动操作：

```typescript
import { useTabBarStore } from '@/store/modules/tabbar'

const tabBarStore = useTabBarStore()

// 切换角色时自动更新TabBar
tabBarStore.switchToRole('handler')
```

## 集成步骤

### 快速集成方法

1. **复制模板代码**：复制上面的代码模板到对应的页面文件

2. **添加导入语句**：在`<script>`顶部添加必要的导入：
   ```typescript
   import PageLayout from '@/components/PageLayout.vue';
   import { useTabBarStore } from '@/store/modules/tabbar';
   import { onShow } from '@dcloudio/uni-app';
   ```

3. **包裹现有内容**：将`<template>`中的根元素用`<PageLayout>`包裹

4. **添加生命周期钩子**：在`<script>`中添加`onShow`钩子，设置对应的Tab状态

### Tab ID 对应关系

| 页面路径 | Tab ID | 说明 |
|---------|--------|------|
| `/pages/user/my-tickets/index` | `my-tickets` | 我的工单 |
| `/pages/user/submit/index` | `submit` | 提交反馈 |
| `/pages/handler/dashboard/index` | `dashboard` | 工作台 |
| `/pages/handler/task-pool/index` | `task-pool` | 待接单池 |
| `/pages/handler/my-tasks/index` | `my-tasks` | 我的任务 |
| `/pages/common/profile/index` | `profile` | 个人中心 |

## 验证集成

### 检查清单

- [ ] 页面能够正常编译
- [ ] TabBar能够正确显示
- [ ] Tab切换功能正常
- [ ] 角色切换时TabBar正确更新
- [ ] 页面布局没有冲突

### 测试步骤

1. **编译测试**：运行`pnpm dev:mp-weixin`检查编译是否通过

2. **功能测试**：
   - 登录不同角色的用户
   - 检查对应角色的TabBar是否正确显示
   - 测试Tab切换功能
   - 检查页面跳转是否正常

3. **视觉测试**：
   - 检查TabBar样式是否正常
   - 验证图标和文字显示
   - 确认徽章功能正常

## 高级配置

### 自定义TabBar样式

```vue
<PageLayout
  :show-tab-bar="true"
  :show-badge="true"
  :active-color="'#007AFF'"
  :inactive-color="'#8E8E93'"
  :animation="true"
  :safe-area="true"
  background-color="#FFFFFF"
  border-color="#E5E5E5"
  tabbar-height="100rpx"
>
  <!-- 页面内容 -->
</PageLayout>
```

### 徽章管理

```typescript
import { useTabBarStore } from '@/store/modules/tabbar';

const tabBarStore = useTabBarStore();

// 显示数字徽章
tabBarStore.updateBadge('my-tickets', 5);

// 显示红点徽章
tabBarStore.showDot('task-pool');

// 清除徽章
tabBarStore.updateBadge('my-tickets', null);
tabBarStore.hideDot('task-pool');
```

## 导航工具

### 使用统一的导航工具

项目提供了统一的导航工具，确保在自定义TabBar环境中正确处理页面跳转：

```typescript
import { navigateTo } from '@/utils/navigation'

// 跳转到指定页面
navigateTo('/pages/user/my-tickets/index')

// 带选项的跳转
navigateTo('/pages/user/my-tickets/index', {
  animation: { duration: 300 },
  onSuccess: () => {
    console.log('跳转成功')
  },
  onFail: () => {
    console.log('跳转失败')
  }
})
```

### 可用的导航方法

```typescript
import { NavigationUtils } from '@/utils/navigation'

// 跳转到指定页面
NavigationUtils.navigateTo('/pages/user/my-tickets/index')

// 跳转到首页（根据角色）
NavigationUtils.navigateToHome('handler') // 处理人员首页
NavigationUtils.navigateToHome('viewer')  // 普通用户首页

// 重新加载当前页面
NavigationUtils.reLaunchCurrentPage()

// 返回上一页
NavigationUtils.navigateBack()

// 关闭当前页面并返回
NavigationUtils.navigateBackAndRedirect()
```

## 故障排除

### 常见问题

1. **TabBar不显示**
   - 检查页面是否正确集成PageLayout
   - 确认TabBar配置中包含当前角色

2. **Tab切换无效**
   - 检查Tab ID是否正确
   - 验证onShow钩子是否正确设置activeTab

3. **样式冲突**
   - 检查是否有多余的底部padding
   - 确认没有其他fixed定位的元素

4. **性能问题**
   - 使用`tabBarPerformance.preloadPages()`预加载页面
   - 启用TabBar缓存功能

5. **页面跳转失败**
   - 使用统一的导航工具`navigateTo()`
   - 确保所有Tab页面都已正确集成PageLayout
   - 检查页面路径是否正确

### 调试方法

```typescript
// 在页面中添加调试信息
onShow(() => {
  console.log('[Debug] TabBar状态:', {
    role: tabBarStore.role,
    activeTab: tabBarStore.activeTab,
    config: tabBarStore.currentConfig
  });
});
```

### 重要说明：官方推荐实现

**自定义TabBar官方方式**：
- 使用 `cover-view` + `cover-image` 组件（确保层级）
- 通过 `uni.getCurrentTabBar().setData()` 更新选中态
- 保留完整的 tabBar 配置（`custom: true`）
- 每个tab页实例独立，需要在每个页面单独更新选中态

**页面切换方式**：
- 使用 `navigateTo()` 函数，统一处理页面跳转
- 内部使用 `uni.reLaunch()` 确保页面栈清洁
- 突破了5个Tab的限制，支持任意数量Tab
- 每次切换都会重新加载页面，确保状态同步

**为什么使用 cover-view？**
- 官方推荐：避免被其他元素遮挡
- 提升层级：确保TabBar始终在最上层
- 兼容性好：支持Skyline模式

**选中态更新**：
- 自动处理：使用 `useTabBarUpdate` Hook
- 官方方式：通过 `getCurrentTabBar().setData()`
- 状态同步：自动更新活跃Tab状态

## 故障排除

### 常见问题

1. **TabBar不显示**
   - 检查页面是否正确集成PageLayout
   - 确认 tabBar 配置中 `custom: true`
   - 验证 TabBar 组件使用 `cover-view`

2. **Tab切换无效**
   - 检查是否正确导入和使用 `useTabBarUpdate`
   - 验证 `onShow` 钩子中调用 `updateTabBarSelected`
   - 检查页面路径是否正确

3. **选中态不更新**
   - 确保使用官方推荐的 `getCurrentTabBar()` 方式
   - 检查 `setData` 调用是否成功
   - 验证页面在 tabBar 配置列表中

4. **样式显示异常**
   - 检查是否使用 `cover-view` 和 `cover-image`
   - 验证 `pointer-events` 样式设置
   - 确认没有CSS冲突

5. **性能问题**
   - 避免频繁调用 `setData`
   - 合并状态更新操作
   - 使用 `tabBarPerformance.preloadPages()` 预加载页面

## 总结

按照本指南完成所有页面集成后，您的应用将拥有完整的动态TabBar功能，支持：

✅ **角色驱动的TabBar** - 不同用户看到不同的Tab
✅ **流畅的导航体验** - 统一的底部导航
✅ **丰富的交互功能** - 徽章、动画等
✅ **高性能优化** - 缓存和预加载机制
✅ **易于维护** - 组件化设计，代码清晰

如果在集成过程中遇到问题，请参考故障排除部分或检查示例代码。
