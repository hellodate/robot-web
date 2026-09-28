<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { traceApi } from '@/api/testdata'
import type { TraceData } from '@/types/api'

/**
 * 追溯系统：SN 全链路查询。
 * 链路：生产下线 → 测试 → 缺陷 → 修复 → 复测 → 出货
 */
const sn = ref('')
const loading = ref(false)
const data = ref<TraceData | null>(null)
const errorMsg = ref('')

/** 节点类型 → 颜色与图标。 */
const typeStyle: Record<string, { color: string; icon: string }> = {
  production: { color: '#2563EB', icon: '🏭' },
  test: { color: '#10B981', icon: '🧪' },
  defect: { color: '#EF4444', icon: '⚠️' },
  repair: { color: '#F59E0B', icon: '🔧' },
  retest: { color: '#8B5CF6', icon: '✅' },
  ship: { color: '#06B6D4', icon: '🚚' },
}

async function search(): Promise<void> {
  const keyword = sn.value.trim()
  if (!keyword) return
  loading.value = true
  errorMsg.value = ''
  data.value = null
  try {
    data.value = await traceApi.trace(keyword)
  } catch {
    errorMsg.value = `未找到 SN「${keyword}」的追溯数据，请确认该设备已进入测试流程`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 预填示例 SN 便于演示（生产环境应清空）
  sn.value = ''
})
</script>

<template>
  <div class="page-container">
    <el-card class="mb-4">
      <div class="search-bar">
        <el-input
          v-model="sn"
          placeholder="输入设备 SN，如 SCAN-2026-001"
          clearable
          size="large"
          style="max-width: 420px"
          @keyup.enter="search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" size="large" :loading="loading" @click="search">追溯查询</el-button>
        <span class="text-secondary text-small">输入 SN 可查看该设备从生产到出货的完整履历</span>
      </div>
    </el-card>

    <el-alert v-if="errorMsg" type="warning" :closable="false" class="mb-4">{{ errorMsg }}</el-alert>

    <template v-if="data">
      <!-- 设备信息 -->
      <el-card class="mb-4">
        <div class="device-head">
          <div>
            <div class="device-sn">{{ data.deviceSn }}</div>
            <div class="text-secondary text-small">
              <span v-if="data.device">型号 {{ data.device.model }}</span>
              <span v-if="data.device?.batchNo"> · 批次 {{ data.device.batchNo }}</span>
              <span v-if="data.device?.firmwareVersion"> · 固件 {{ data.device.firmwareVersion }}</span>
            </div>
          </div>
          <div class="device-stats">
            <el-tag type="info" size="small">测试记录 {{ data.recordCount }}</el-tag>
            <el-tag :type="data.defectCount > 0 ? 'danger' : 'success'" size="small">缺陷 {{ data.defectCount }}</el-tag>
            <el-tag v-if="data.device" :type="data.device.status === 'SHIPPED' ? 'success' : 'warning'" size="small">
              {{ data.device.statusName }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- 追溯时间线 -->
      <el-card>
        <template #header><span class="card-title">追溯链路</span></template>
        <el-empty v-if="data.nodes.length === 0" description="暂无追溯节点" />
        <div v-else class="timeline">
          <div v-for="(node, i) in data.nodes" :key="i" class="tl-item">
            <div class="tl-axis">
              <div class="tl-dot" :style="{ backgroundColor: typeStyle[node.type]?.color ?? '#9CA3AF' }">
                {{ typeStyle[node.type]?.icon ?? '•' }}
              </div>
              <div v-if="i < data.nodes.length - 1" class="tl-line" />
            </div>
            <div class="tl-body">
              <div class="tl-head">
                <span class="tl-stage" :style="{ color: typeStyle[node.type]?.color }">[{{ node.stageName }}]</span>
                <span class="tl-title">{{ node.title }}</span>
                <span class="tl-time">{{ node.time?.replace('T', ' ').slice(0, 16) ?? '待执行' }}</span>
              </div>
              <div v-if="node.description" class="tl-desc">{{ node.description }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </template>

    <el-empty v-else-if="!loading && !errorMsg" description="请输入设备 SN 开始追溯" :image-size="120" />
  </div>
</template>

<style scoped lang="scss">
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.device-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.device-sn {
  font-size: 18px;
  font-weight: 700;
  font-family: $font-family-mono;
}

.device-stats {
  display: flex;
  gap: 8px;
}

.card-title {
  font-weight: 600;
}

.timeline {
  padding-left: 8px;
}

.tl-item {
  display: flex;
  gap: 16px;
}

.tl-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.tl-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
}

.tl-line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background-color: $gray-200;
}

.tl-body {
  flex: 1;
  padding-bottom: 20px;
}

.tl-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tl-stage {
  font-size: 12px;
  font-weight: 600;
}

.tl-title {
  font-size: 14px;
  font-weight: 500;
}

.tl-time {
  margin-left: auto;
  font-size: 12px;
  color: $gray-500;
  font-family: $font-family-mono;
}

.tl-desc {
  margin-top: 4px;
  font-size: 13px;
  color: $gray-600;
  line-height: 1.6;
}
</style>
