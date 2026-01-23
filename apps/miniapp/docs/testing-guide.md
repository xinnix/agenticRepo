# 自定义TabBar测试指南

## 📋 测试清单

### 1. 基础功能测试

#### ✅ 页面配置
- [ ] 检查 `pages.json` 中 `tabBar.custom` 设置为 `true`
- [ ] 验证 `tabBar.list` 配置完整
- [ ] 确认 `custom-tab-bar` 目录存在（如果需要）

#### ✅ 组件渲染
- [ ] TabBar 正常显示
- [ ] 图标和文字正确显示
- [ ] cover-view 层级正确

#### ✅ 交互功能
- [ ] Tab 点击响应正常
- [ ] 页面切换成功
- [ ] 选中态更新正确

### 2. 角色测试

#### ✅ 普通用户（viewer）
- [ ] 登录 viewer 角色
- [ ] 验证 TabBar 显示：我的工单、提交反馈、我的
- [ ] 测试各 Tab 切换
- [ ] 确认徽章显示正常

#### ✅ 处理人员（handler）
- [ ] 登录 handler 角色
- [ ] 验证 TabBar 显示：工作台、待接单池、我的任务、我的
- [ ] 测试各 Tab 切换
- [ ] 确认徽章显示正常

#### ✅ 部门管理员（dept_admin）
- [ ] 登录 dept_admin 角色
- [ ] 验证使用 handler 的 Tab 配置
- [ ] 测试角色切换

### 3. 高级功能测试

#### ✅ 徽章管理
- [ ] 数字徽章显示
- [ ] 红点徽章显示
- [ ] 徽章更新
- [ ] 徽章清除

#### ✅ 状态同步
- [ ] 页面刷新后选中态保持
- [ ] 页面返回后选中态正确
- [ ] 角色切换后 TabBar 正确更新

#### ✅ 性能测试
- [ ] Tab 切换动画流畅
- [ ] 页面加载速度正常
- [ ] 内存占用合理

### 4. 兼容性测试

#### ✅ 不同设备
- [ ] iPhone (iOS)
- [ ] Android 手机
- [ ] 不同屏幕尺寸

#### ✅ 不同基础库版本
- [ ] 基础库 2.5.0+
- [ ] 基础库 2.6.0+
- [ ] 最新版本

#### ✅ 特殊场景
- [ ] 横竖屏切换
- [ ] 深色模式（如果支持）
- [ ] 网络异常

## 🔍 测试步骤

### 步骤 1：检查配置

```bash
# 检查 pages.json 配置
cat pages.json | grep -A 10 "tabBar"
```

应显示：
```json
{
  "tabBar": {
    "custom": true,
    "list": [...]
  }
}
```

### 步骤 2：编译项目

```bash
# 安装依赖
pnpm install

# 编译为微信小程序
pnpm dev:mp-weixin
```

### 步骤 3：在微信开发者工具中测试

1. **导入项目**
   - 选择 `dist/dev/mp-weixin` 目录
   - 导入到微信开发者工具

2. **基础测试**
   - 检查是否有编译错误
   - 确认 TabBar 正常显示
   - 测试 Tab 切换功能

3. **角色测试**
   - 使用不同角色账号登录
   - 验证对应角色的 Tab 配置
   - 测试角色切换

### 步骤 4：性能测试

```bash
# 检查控制台输出
# 应无错误信息
# 性能日志应显示：
# - [DynamicTabBar] 组件挂载
# - [useTabBarUpdate] 更新TabBar选中态
```

## 📊 预期结果

### 正常情况

#### 控制台日志
```
✅ [DynamicTabBar] 组件挂载
✅ [useTabBarUpdate] 更新TabBar选中态: {...}
✅ [DynamicTabBar] Tab切换成功
```

#### 用户体验
- TabBar 正常显示在最底部
- 图标和文字清晰可见
- 点击 Tab 有视觉反馈
- 页面切换流畅
- 选中态实时更新

### 异常情况

#### TabBar 不显示
**可能原因**：
- `pages.json` 配置错误
- 组件未正确导入
- 样式冲突

**解决方案**：
```bash
# 检查配置
grep -n "custom" pages.json

# 检查组件导入
grep -n "DynamicTabBar" components/*.vue
```

#### Tab 切换无效
**可能原因**：
- 页面路径错误
- 导航方法错误
- 状态更新失败

**解决方案**：
```bash
# 检查页面路径
grep -n "pagePath" config/tabbar.config.ts

# 检查导航方法
grep -n "navigateTo" utils/navigation.ts
```

#### 选中态不更新
**可能原因**：
- `getCurrentTabBar()` 调用失败
- `setData()` 未执行
- 状态管理错误

**解决方案**：
```bash
# 检查 Hook 导入
grep -n "useTabBarUpdate" composables/*.ts

# 检查 onShow 钩子
grep -n "onShow" pages/*/index.vue
```

## 🚀 性能监控

### 渲染性能

```javascript
// 在控制台中监控
console.log('[Performance] TabBar 渲染耗时:', performance.now())

// 页面切换性能
console.log('[Performance] 页面切换耗时:', performance.now())
```

### 内存监控

```javascript
// 监控内存占用
setInterval(() => {
  if (performance.memory) {
    console.log('[Memory] 当前内存:', performance.memory.usedJSHeapSize)
  }
}, 5000)
```

## 📝 测试报告模板

### 测试结果

| 测试项目 | 状态 | 备注 |
|---------|------|------|
| 页面配置 | ✅ 通过 | custom: true 设置正确 |
| 组件渲染 | ✅ 通过 | cover-view 正常显示 |
| Tab 切换 | ✅ 通过 | 点击响应正常 |
| 角色适配 | ✅ 通过 | 不同角色正确显示 |
| 徽章功能 | ✅ 通过 | 数字和红点正常 |
| 性能表现 | ✅ 通过 | 切换流畅 |

### 问题列表

| 问题描述 | 严重程度 | 解决方案 | 状态 |
|---------|----------|----------|------|
| 无 | - | - | - |

### 性能数据

| 指标 | 数值 | 目标 | 结果 |
|------|------|------|------|
| Tab 切换耗时 | 100ms | < 200ms | ✅ |
| 页面加载时间 | 300ms | < 500ms | ✅ |
| 内存占用 | 15MB | < 30MB | ✅ |

## 🎉 测试完成

测试完成后，应确认：

- [ ] 所有基础功能正常
- [ ] 所有角色适配正确
- [ ] 性能表现良好
- [ ] 无严重问题

## 📞 支持与反馈

如果测试过程中遇到问题，请：

1. 查看控制台错误日志
2. 检查页面配置和组件导入
3. 参考故障排除指南
4. 联系开发团队

---

**测试通过标准**：所有测试项目应显示 ✅，无严重问题。
