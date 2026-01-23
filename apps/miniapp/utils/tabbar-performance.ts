/**
 * TabBar性能优化工具
 */

export interface CacheConfig {
  role: string
  config: any[]
  timestamp: number
  expiresIn: number // 过期时间（毫秒）
}

export interface PreloadTask {
  pagePath: string
  priority: 'high' | 'medium' | 'low'
  delay: number
}

export class TabBarPerformanceManager {
  private static instance: TabBarPerformanceManager
  private configCache = new Map<string, CacheConfig>()
  private preloadCache = new Set<string>()
  private preloadQueue: PreloadTask[] = []
  private isPreloading = false

  private constructor() {}

  static getInstance(): TabBarPerformanceManager {
    if (!this.instance) {
      this.instance = new TabBarPerformanceManager()
    }
    return this.instance
  }

  /**
   * 获取缓存的配置
   */
  getCachedConfig(role: string, maxAge: number = 5 * 60 * 1000): any[] | null {
    const cache = this.configCache.get(role)
    if (!cache) return null

    const now = Date.now()
    if (now - cache.timestamp > cache.expiresIn) {
      // 缓存过期，删除
      this.configCache.delete(role)
      console.log('[TabBarPerformance] 缓存过期，删除:', role)
      return null
    }

    console.log('[TabBarPerformance] 使用缓存配置:', role)
    return cache.config
  }

  /**
   * 缓存配置
   */
  cacheConfig(role: string, config: any[], expiresIn: number = 5 * 60 * 1000): void {
    const cacheConfig: CacheConfig = {
      role,
      config,
      timestamp: Date.now(),
      expiresIn
    }

    this.configCache.set(role, cacheConfig)
    console.log('[TabBarPerformance] 缓存配置:', role, '过期时间:', expiresIn / 1000, '秒')
  }

  /**
   * 预加载页面
   */
  async preloadPages(paths: string[], options?: { priority?: 'high' | 'medium' | 'low', delay?: number }): Promise<void> {
    const { priority = 'medium', delay = 0 } = options || {}

    for (const path of paths) {
      if (this.preloadCache.has(path)) {
        console.log('[TabBarPerformance] 页面已预加载:', path)
        continue
      }

      const task: PreloadTask = {
        pagePath: path,
        priority,
        delay
      }

      this.preloadQueue.push(task)
    }

    // 按优先级排序
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    console.log('[TabBarPerformance] 添加预加载任务:', this.preloadQueue.length)

    // 开始预加载
    this.startPreloading()
  }

  /**
   * 开始预加载
   */
  private async startPreloading(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true
    console.log('[TabBarPerformance] 开始预加载队列')

    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift()!

      // 延迟执行
      if (task.delay > 0) {
        await this.delay(task.delay)
      }

      await this.preloadSinglePage(task.pagePath)
    }

    this.isPreloading = false
    console.log('[TabBarPerformance] 预加载完成')
  }

  /**
   * 预加载单个页面
   */
  private async preloadSinglePage(pagePath: string): Promise<void> {
    try {
      console.log('[TabBarPerformance] 预加载页面:', pagePath)

      // 检查页面是否支持预加载
      if (!this.isPagePreloadable(pagePath)) {
        console.log('[TabBarPerformance] 页面不支持预加载:', pagePath)
        return
      }

      // 执行预加载逻辑
      // 这里可以根据实际情况实现具体的预加载策略
      // 比如预加载图片资源、请求API数据等

      // 模拟预加载过程
      await this.simulatePreloading(pagePath)

      // 标记为已预加载
      this.preloadCache.add(pagePath)
      console.log('[TabBarPerformance] 页面预加载完成:', pagePath)

    } catch (error) {
      console.error('[TabBarPerformance] 页面预加载失败:', pagePath, error)
    }
  }

  /**
   * 检查页面是否支持预加载
   */
  private isPagePreloadable(pagePath: string): boolean {
    // 这里可以根据实际情况定义哪些页面支持预加载
    const preloadablePages = [
      '/pages/user/my-tickets/index',
      '/pages/user/submit/index',
      '/pages/handler/dashboard/index',
      '/pages/handler/task-pool/index',
      '/pages/handler/my-tasks/index',
      '/pages/common/profile/index'
    ]

    return preloadablePages.includes(pagePath)
  }

  /**
   * 模拟预加载过程
   */
  private async simulatePreloading(pagePath: string): Promise<void> {
    return new Promise((resolve) => {
      // 模拟异步预加载过程
      setTimeout(() => {
        console.log('[TabBarPerformance] 模拟预加载完成:', pagePath)
        resolve()
      }, Math.random() * 100 + 50) // 50-150ms的随机延迟
    })
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取预加载状态
   */
  getPreloadStatus(): { isPreloading: boolean; queueLength: number; cachedCount: number } {
    return {
      isPreloading: this.isPreloading,
      queueLength: this.preloadQueue.length,
      cachedCount: this.preloadCache.size
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, cache] of this.configCache.entries()) {
      if (now - cache.timestamp > cache.expiresIn) {
        this.configCache.delete(key)
        cleanedCount++
      }
    }

    console.log('[TabBarPerformance] 清理过期缓存:', cleanedCount, '项')
    return cleanedCount
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { totalConfigs: number; totalPreloaded: number; cacheKeys: string[] } {
    return {
      totalConfigs: this.configCache.size,
      totalPreloaded: this.preloadCache.size,
      cacheKeys: Array.from(this.configCache.keys())
    }
  }

  /**
   * 清理所有缓存
   */
  clearAllCache(): void {
    this.configCache.clear()
    this.preloadCache.clear()
    this.preloadQueue = []
    console.log('[TabBarPerformance] 清理所有缓存')
  }

  /**
   * 优化图片加载
   */
  optimizeImageLoading(imageUrls: string[]): void {
    console.log('[TabBarPerformance] 优化图片加载:', imageUrls.length, '张图片')

    // 图片懒加载和预加载策略
    imageUrls.forEach((url, index) => {
      // 根据页面重要性决定加载时机
      const shouldPreload = index < 3 // 只预加载前3张图片

      if (shouldPreload) {
        // 预加载重要图片
        this.preloadImage(url)
      } else {
        // 延迟加载其他图片
        setTimeout(() => {
          this.preloadImage(url)
        }, index * 100)
      }
    })
  }

  /**
   * 预加载图片
   */
  private preloadImage(url: string): void {
    const img = new Image()
    img.onload = () => {
      console.log('[TabBarPerformance] 图片预加载成功:', url)
    }
    img.onerror = () => {
      console.error('[TabBarPerformance] 图片预加载失败:', url)
    }
    img.src = url
  }

  /**
   * 监控性能指标
   */
  monitorPerformance(operation: string, startTime: number): void {
    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`[TabBarPerformance] ${operation} 耗时:`, duration.toFixed(2), 'ms')

    // 性能警告
    if (duration > 1000) {
      console.warn(`[TabBarPerformance] ${operation} 性能警告: 超过1秒`)
    }

    // 可以在这里添加性能监控上报
  }
}

// 单例导出
export const tabBarPerformance = TabBarPerformanceManager.getInstance()

// 导出便捷方法
export const {
  getCachedConfig,
  cacheConfig,
  preloadPages,
  clearAllCache,
  getCacheStats,
  cleanExpiredCache
} = tabBarPerformance
