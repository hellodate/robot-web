<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { nodeApi } from '@/api/library'
import { NodeStatusLabel, NodeStatusTagType } from '@/constants/enums'
import type { PcNode } from '@/types/api'

/**
 * 顶栏。
 *
 * 组成：折叠按钮 + 页面标题 + 节点状态 + 用户信息 + 操作入口。
 * 节点状态每 30 秒轮询（与后端心跳超时阈值 90 秒配合）。
 */
defineProps<{ title: string }>()

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const nodes = ref<PcNode[]>([])
let pollTimer: number | null = null

/** 在线节点数。 */
const onlineCount = computed(() => nodes.value.filter((n) => n.status !== 'OFFLINE').length)

/** 总节点数。 */
const totalCount = computed(() => nodes.value.length)

/** 节点状态汇总标签类型（有异常时标红）。 */
const nodeSummaryType = computed(() => {
  if (nodes.value.some((n) => n.status === 'ONLINE_FAULT')) return 'danger'
  if (onlineCount.value > 0) return 'success'
  return 'info'
})

async function loadNodes(): Promise<void> {
  try {
    nodes.value = await nodeApi.list()
  } catch {
    // 静默失败（顶栏状态非关键路径）
  }
}

async function handleLogout(): Promise<void> {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await authStore.logout()
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}

function goProfile(): void {
  void router.push('/user')
}

onMounted(() => {
  void loadNodes()
  pollTimer = window.setInterval(loadNodes, 30_000)
})

onUnmounted(() => {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <header class="top-bar">
    <!-- 左区：折叠按钮 + 标题 -->
    <div class="top-left">
      <el-button text class="collapse-btn" @click="appStore.toggleSidebar()">
        <el-icon :size="18">
          <component :is="appStore.sidebarCollapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </el-button>
      <h1 class="page-title">{{ title }}</h1>
    </div>

    <!-- 右区：节点状态 + 用户信息 + 操作 -->
    <div class="top-right">
      <!-- 节点状态 -->
      <el-tooltip placement="bottom" effect="light">
        <template #content>
          <div v-if="nodes.length === 0">暂无已注册节点</div>
          <div v-else>
            <div v-for="n in nodes" :key="n.nodeCode" class="node-tip-row">
              <span>{{ n.nodeCode }}</span>
              <el-tag :type="NodeStatusTagType[n.status] ?? 'info'" size="small" effect="light">
                {{ NodeStatusLabel[n.status] ?? n.status }}
              </el-tag>
              <span v-if="n.robotModeName" class="node-tip-mode">{{ n.robotModeName }}</span>
            </div>
          </div>
        </template>
        <el-tag :type="nodeSummaryType" effect="plain" size="default" class="node-tag">
          <el-icon><Monitor /></el-icon>
          <span class="node-tag-text">节点 {{ onlineCount }}/{{ totalCount }}</span>
        </el-tag>
      </el-tooltip>

      <!-- 用户信息 -->
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="28" class="user-avatar">
            {{ authStore.userInfo?.name?.charAt(0) ?? '?' }}
          </el-avatar>
          <span class="user-name">{{ authStore.displayName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goProfile">
              <el-icon><User /></el-icon>个人信息
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid $gray-200;
  flex-shrink: 0;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  padding: 4px;
  color: $gray-600;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: $gray-900;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.node-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}

.node-tag-text {
  font-size: 13px;
}

.node-tip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.node-tip-mode {
  font-size: 12px;
  color: #6b7280;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.15s;

  &:hover {
    background-color: $gray-100;
  }
}

.user-avatar {
  background-color: $primary-500;
  color: #fff;
  font-size: 13px;
}

.user-name {
  font-size: 14px;
  color: $gray-700;
}
</style>
