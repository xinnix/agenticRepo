<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/store';

const userStore = useUserStore();

onLaunch(() => {
	console.log('App Launch');

	// 初始化：从本地存储加载认证状态
	userStore.loadFromStorage();

	console.log('[App] Auth initialized, token exists:', !!userStore.token);
	console.log('[App] isAuthenticated:', userStore.isAuthenticated);
});

onShow(() => {
	console.log('App Show');
});

onHide(() => {
	console.log('App Hide');
});
</script>

<style lang="scss">
/* 引入 uView Plus 全局样式 */
@import "uview-plus/index.scss";

/* 引入极简主义全局样式 */
@import "./styles/minimal.scss";

/* 引入 uView Plus 组件样式覆盖 */
@import "./styles/uview-override.scss";

/* 现代极简主义主题全局样式 */
page {
  background-color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Noto Sans SC', sans-serif;
  color: #171717;
  line-height: 1.6;
  letter-spacing: 0.5rpx;
}

scroll-view {
  -webkit-overflow-scrolling: touch;
}

input:focus,
textarea:focus {
  outline: none;
}

/* 去除所有默认样式 */
button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
}

button::after {
  border: none;
}
</style>
