import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserRoleLevel } from '@/constants/enums'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false, minimum: 0.2, speed: 400 })

/**
 * 路由配置。
 *
 * 设计约定：
 *  1. 路由 meta 声明权限（`roles` 数组）与显示信息（`title` / `icon` / `hidden`）
 *  2. 菜单由路由表自动生成（见 layouts/components/SideMenu.vue），避免双份维护
 *  3. 权限判定基于角色层级（roleLevel），而非枚举匹配 —— 便于新增角色时不改路由表
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true, public: true },
  },

  {
    path: '/',
    component: () => import('@/layouts/IndexLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled', authLevel: UserRoleLevel.GUEST },
      },
      {
        path: 'scenario',
        name: 'ScenarioList',
        component: () => import('@/views/scenario/index.vue'),
        meta: { title: '场景编辑器', icon: 'Grid', group: '测试管理', authLevel: UserRoleLevel.GUEST },
      },
      {
        path: 'scenario/:id/edit',
        name: 'ScenarioEdit',
        component: () => import('@/views/scenario/Editor.vue'),
        meta: { title: '场景编辑', hidden: true, authLevel: UserRoleLevel.TEST_ENGINEER },
      },
      {
        path: 'action',
        name: 'ActionLibrary',
        component: () => import('@/views/action/index.vue'),
        meta: { title: '动作库', icon: 'Connection', group: '测试管理', authLevel: UserRoleLevel.GUEST },
      },
      {
        path: 'database',
        name: 'TestDatabase',
        component: () => import('@/views/database/index.vue'),
        meta: { title: '测试数据库', icon: 'Coin', group: '数据中心', authLevel: UserRoleLevel.GUEST },
      },
      {
        path: 'analysis',
        name: 'Analysis',
        component: () => import('@/views/analysis/index.vue'),
        meta: { title: '分析引擎', icon: 'TrendCharts', group: '数据中心', authLevel: UserRoleLevel.GUEST },
      },
      {
        path: 'trace',
        name: 'Trace',
        component: () => import('@/views/trace/index.vue'),
        meta: { title: '追溯系统', icon: 'Search', group: '数据中心', authLevel: UserRoleLevel.GUEST },
      },
      {
        path: 'device',
        name: 'Device',
        component: () => import('@/views/device/index.vue'),
        meta: { title: '设备台账', icon: 'Box', group: '数据中心', authLevel: UserRoleLevel.GUEST },
      },
      {
        path: 'audit',
        name: 'AuditLog',
        component: () => import('@/views/audit/index.vue'),
        meta: { title: '审计日志', icon: 'Document', group: '系统管理', authLevel: UserRoleLevel.ADMIN },
      },
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', group: '系统管理', authLevel: UserRoleLevel.ADMIN },
      },
      {
        path: 'node',
        name: 'NodeManage',
        component: () => import('@/views/node/index.vue'),
        meta: { title: '控制端节点', icon: 'Monitor', group: '系统管理', authLevel: UserRoleLevel.TEST_ENGINEER },
      },
    ],
  },

  // ── 错误页 ──
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限', hidden: true, public: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true, public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH || '/'),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/**
 * 全局前置守卫：认证校验 + 角色层级校验。
 *
 * 权限模型：角色层级数值比较（GUEST=0 / TESTER=1 / TEST_ENGINEER=2 / ROBOT_ENGINEER=3 / ADMIN=4）
 *  - 未登录访问受保护路由 → 跳转登录页（携带 redirect 参数）
 *  - 已登录但层级不足 → 跳转 403
 *  - 已登录访问登录页 → 跳转工作台
 */
router.beforeEach((to, _from, next) => {
  NProgress.start()

  const authStore = useAuthStore()
  const isPublic = to.meta.public === true

  // 未登录
  if (!authStore.isAuthenticated) {
    if (isPublic) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
    return
  }

  // 已登录访问登录页 → 回工作台
  if (to.path === '/login') {
    next({ path: '/dashboard' })
    return
  }

  // 角色层级校验
  const requiredLevel = (to.meta.authLevel as number | undefined) ?? UserRoleLevel.GUEST
  if (authStore.roleLevel < requiredLevel) {
    next({ path: '/403' })
    return
  }

  next()
})

router.afterEach((to) => {
  // 页面标题
  const title = (to.meta.title as string | undefined) ?? ''
  document.title = title ? `${title} · 拓恩普自动化测试系统` : '拓恩普自动化测试系统'
  NProgress.done()
})

router.onError(() => {
  NProgress.done()
})

export default router
