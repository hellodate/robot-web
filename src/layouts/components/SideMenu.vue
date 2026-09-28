<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 侧边菜单。
 *
 * 设计约定：
 *  - 菜单项由路由表自动生成（meta.title / meta.icon / meta.group / meta.hidden）
 *  - 按 meta.group 分组显示（测试管理 / 数据中心 / 系统管理）
 *  - 权限过滤：路由 meta.authLevel > 当前角色层级时不显示
 */
const props = defineProps<{ collapsed: boolean }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

/** 默认图标兜底。 */
const DEFAULT_ICON = 'Menu'

interface MenuItem {
  index: string
  title: string
  icon: string
}

interface MenuGroup {
  name: string
  items: MenuItem[]
}

/** 从路由表提取可见菜单（按 meta.group 分组，保留定义顺序）。 */
const menuGroups = computed<MenuGroup[]>(() => {
  const layoutRoute = router.getRoutes().find((r) => r.path === '/' && r.children.length > 0)
  const children = (layoutRoute?.children ?? []) as RouteRecordRaw[]

  const groups: MenuGroup[] = []
  const groupMap = new Map<string, MenuGroup>()

  children.forEach((child) => {
    const meta = child.meta ?? {}
    if (meta.hidden === true) return

    // 权限过滤：无权限的菜单项不显示
    const requiredLevel = (meta.authLevel as number | undefined) ?? 0
    if (authStore.roleLevel < requiredLevel) return

    const path = child.path.startsWith('/') ? child.path : `/${child.path}`
    const item: MenuItem = {
      index: path,
      title: (meta.title as string) ?? path,
      icon: (meta.icon as string) ?? DEFAULT_ICON,
    }

    const groupName = (meta.group as string) ?? ''
    if (!groupName) {
      // 无分组项直接平铺（如工作台）
      groups.push({ name: '', items: [item] })
      return
    }

    let group = groupMap.get(groupName)
    if (!group) {
      group = { name: groupName, items: [] }
      groupMap.set(groupName, group)
      groups.push(group)
    }
    group.items.push(item)
  })

  return groups.filter((g) => g.items.length > 0)
})

/** 当前激活菜单项。 */
const activeMenu = computed(() => {
  // 子页面（如场景编辑）高亮其列表页
  const meta = route.meta as Record<string, unknown>
  if (meta.activeMenu) return meta.activeMenu as string
  return route.path
})

function handleSelect(index: string): void {
  if (index !== route.path) {
    void router.push(index)
  }
}
</script>

<template>
  <div class="side-menu">
    <!-- 品牌区 -->
    <div class="brand" :class="{ collapsed: props.collapsed }">
      <span class="brand-logo">🤖</span>
      <div v-show="!props.collapsed" class="brand-text">
        <div class="brand-name">拓恩普测试平台</div>
        <div class="brand-sub">Web 管理端 v1.0</div>
      </div>
    </div>

    <!-- 菜单 -->
    <el-scrollbar class="menu-scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="props.collapsed"
        :collapse-transition="false"
        class="menu"
        @select="handleSelect"
      >
        <template v-for="(group, gi) in menuGroups" :key="gi">
          <!-- 分组标题（折叠时隐藏） -->
          <div v-if="group.name && !props.collapsed" class="menu-group-title">
            {{ group.name }}
          </div>
          <el-menu-item v-for="item in group.items" :key="item.index" :index="item.index">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>

    <!-- 底部版本信息 -->
    <div v-show="!props.collapsed" class="menu-footer">
      <div>拓恩普电子（深圳）有限公司</div>
      <div class="menu-footer-ver">版本 V1.0.0</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.side-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid $gray-200;
  flex-shrink: 0;

  &.collapsed {
    justify-content: center;
    padding: 0;
  }
}

.brand-logo {
  font-size: 22px;
  line-height: 1;
}

.brand-text {
  min-width: 0;
}

.brand-name {
  font-size: 14px;
  font-weight: 600;
  color: $gray-900;
  white-space: nowrap;
}

.brand-sub {
  font-size: 11px;
  color: $gray-400;
  white-space: nowrap;
}

.menu-scroll {
  flex: 1;
  min-height: 0;
}

.menu {
  border-right: none;

  :deep(.el-menu-item) {
    height: 40px;
    line-height: 40px;
    margin: 2px 8px;
    border-radius: 8px;
    font-size: 14px;

    &.is-active {
      background-color: $primary-50;
      color: $primary-500;
      font-weight: 600;
    }

    &:hover {
      background-color: $gray-100;
    }
  }
}

.menu-group-title {
  padding: 14px 16px 6px;
  font-size: 11px;
  font-weight: 600;
  color: $gray-400;
  letter-spacing: 1px;
}

.menu-footer {
  padding: 12px 16px;
  border-top: 1px solid $gray-200;
  font-size: 12px;
  color: $gray-400;
  flex-shrink: 0;
}

.menu-footer-ver {
  margin-top: 2px;
}
</style>
