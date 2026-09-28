<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { nodeApi } from '@/api/library'
import { NodeStatusLabel, NodeStatusTagType, RobotModeLabel } from '@/constants/enums'
import type { PcNode } from '@/types/api'

/** 控制端节点：PC 控制端注册状态、机械臂模式、心跳监控（30 秒轮询）。 */
const loading = ref(false)
const list = ref<PcNode[]>([])
let timer: number | null = null

async function load(): Promise<void> {
  loading.value = true
  try {
    list.value = await nodeApi.list()
  } finally {
    loading.value = false
  }
}

function robotModeName(mode?: number): string {
  if (mode === undefined || mode === null) return '—'
  return RobotModeLabel[mode] ?? `未知(${mode})`
}

onMounted(() => {
  void load()
  timer = window.setInterval(load, 30_000)
})

onUnmounted(() => {
  if (timer !== null) window.clearInterval(timer)
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="toolbar">
      <span class="text-secondary text-small">节点状态每 30 秒自动刷新（心跳超时 90 秒判定离线）</span>
      <div class="toolbar-spacer" />
      <el-button @click="load"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <el-empty v-if="list.length === 0" description="暂无已注册的控制端节点" />

    <el-row v-else :gutter="16">
      <el-col v-for="n in list" :key="n.id" :span="8" class="mb-4">
        <el-card shadow="hover">
          <div class="node-head">
            <div>
              <div class="node-code">{{ n.nodeCode }}</div>
              <div class="node-name">{{ n.nodeName || '未命名节点' }}</div>
            </div>
            <el-tag :type="NodeStatusTagType[n.status] ?? 'info'" effect="light">
              {{ NodeStatusLabel[n.status] ?? n.status }}
            </el-tag>
          </div>

          <el-descriptions :column="1" size="small" class="mt-3">
            <el-descriptions-item label="IP 地址">
              <span class="text-mono">{{ n.ipAddress || '—' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="软件版本">{{ n.appVersion || '—' }}</el-descriptions-item>
            <el-descriptions-item label="场景缓存版本">{{ n.scenarioCacheVersion || '—' }}</el-descriptions-item>
            <el-descriptions-item label="机械臂模式">
              <span :class="{ 'text-danger': n.robotErrorCode && n.robotErrorCode !== 0 }">
                {{ robotModeName(n.robotMode) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="最近心跳">
              <span class="text-mono text-small">{{ n.lastHeartbeatAt?.replace('T', ' ').slice(0, 19) ?? '—' }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-alert
            v-if="n.robotErrorCode && n.robotErrorCode !== 0"
            type="error"
            :closable="false"
            class="mt-3"
            :title="`机械臂错误码：${n.robotErrorCode}`"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.node-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.node-code {
  font-size: 16px;
  font-weight: 700;
  font-family: $font-family-mono;
}

.node-name {
  font-size: 13px;
  color: $gray-500;
  margin-top: 2px;
}
</style>
