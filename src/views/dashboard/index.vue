<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { recordApi, defectApi } from '@/api/testdata'
import { scenarioApi, nodeApi } from '@/api/library'
import { TestResultLabel, TestResultTagType, NodeStatusLabel, NodeStatusTagType } from '@/constants/enums'
import type { TestRecord, Defect, Scenario, PcNode } from '@/types/api'

/**
 * 工作台：全局概览与快捷入口。
 */
const router = useRouter()
const loading = ref(false)
const stats = ref({ scenarioCount: 0, recordCount: 0, defectCount: 0, nodeOnline: 0 })
const recentRecords = ref<TestRecord[]>([])
const pendingDefects = ref<Defect[]>([])
const nodes = ref<PcNode[]>([])

async function load(): Promise<void> {
  loading.value = true
  try {
    const [scenarioPage, defectPage, recordList, nodeList] = await Promise.all([
      scenarioApi.page({ page: 1, size: 1 }),
      defectApi.page({ page: 1, size: 5, status: 'PENDING' }),
      recordApi.recent(8),
      nodeApi.list(),
    ])

    stats.value = {
      scenarioCount: scenarioPage.page.total,
      recordCount: recordList.length,
      defectCount: defectPage.page.total,
      nodeOnline: nodeList.filter((n) => n.status !== 'OFFLINE').length,
    }
    recentRecords.value = recordList
    pendingDefects.value = defectPage.list
    nodes.value = nodeList
  } finally {
    loading.value = false
  }
}

function goto(path: string): void {
  void router.push(path)
}

onMounted(load)
</script>

<template>
  <div class="page-container" v-loading="loading">
    <!-- 统计卡 -->
    <el-row :gutter="16" class="mb-6">
      <el-col v-for="card in [
        { label: '场景总数', value: stats.scenarioCount, icon: 'Grid', color: '#2563EB', path: '/scenario' },
        { label: '待处理缺陷', value: stats.defectCount, icon: 'Warning', color: '#EF4444', path: '/database' },
        { label: '在线节点', value: stats.nodeOnline, icon: 'Monitor', color: '#10B981', path: '/node' },
        { label: '最近记录', value: stats.recordCount, icon: 'Document', color: '#8B5CF6', path: '/database' },
      ]" :key="card.label" :span="6">
        <el-card shadow="hover" class="stat-card" @click="goto(card.path)">
          <div class="stat-head">
            <span class="stat-label">{{ card.label }}</span>
            <el-icon :size="20" :color="card.color"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-hint">点击查看详情 →</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 最近测试记录 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近测试记录</span>
              <el-button text type="primary" @click="goto('/database')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentRecords" size="small" @row-click="goto('/database')">
            <el-table-column prop="recordCode" label="记录编号" width="140" />
            <el-table-column prop="deviceSn" label="设备 SN" width="150" />
            <el-table-column prop="scenarioName" label="测试场景" show-overflow-tooltip />
            <el-table-column label="结果" width="80">
              <template #default="{ row }">
                <el-tag :type="TestResultTagType[row.result] ?? 'info'" size="small" effect="light">
                  {{ TestResultLabel[row.result] ?? row.result }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operatorAccount" label="操作人" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 待处理缺陷 + 节点状态 -->
      <el-col :span="8">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header"><span>待处理缺陷</span></div>
          </template>
          <div v-if="pendingDefects.length === 0" class="empty-block">暂无待处理缺陷</div>
          <div v-for="d in pendingDefects" :key="d.id" class="defect-item">
            <div class="defect-sn">{{ d.deviceSn }}</div>
            <div class="defect-desc">{{ d.description }}</div>
            <el-tag :type="d.level === 'CRITICAL' ? 'danger' : 'warning'" size="small">{{ d.levelName }}</el-tag>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div class="card-header"><span>控制端节点</span></div>
          </template>
          <div v-if="nodes.length === 0" class="empty-block">暂无已注册节点</div>
          <div v-for="n in nodes" :key="n.id" class="node-item">
            <div>
              <div class="node-code">{{ n.nodeCode }}</div>
              <div class="node-name">{{ n.nodeName }}</div>
            </div>
            <el-tag :type="NodeStatusTagType[n.status] ?? 'info'" size="small" effect="light">
              {{ NodeStatusLabel[n.status] ?? n.status }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  cursor: pointer;
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }
}

.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-hint {
  margin-top: 8px;
  font-size: 12px;
  color: $gray-400;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.defect-item {
  padding: 8px 0;
  border-bottom: 1px solid $gray-100;

  &:last-child {
    border-bottom: none;
  }
}

.defect-sn {
  font-size: 13px;
  font-weight: 500;
}

.defect-desc {
  font-size: 12px;
  color: $gray-500;
  margin: 2px 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid $gray-100;

  &:last-child {
    border-bottom: none;
  }
}

.node-code {
  font-size: 13px;
  font-weight: 500;
}

.node-name {
  font-size: 12px;
  color: $gray-500;
}
</style>
