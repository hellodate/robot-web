<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '@/utils/request'
import type { RobotAction } from '@/types/api'

/**
 * 动作库：展示 PC 控制端上传的机器人动作。
 *
 * stepsJson 由 PC 端序列化后直接落库，步骤类型包含：
 * move(动作点) / path(录制路径) / wait(延时) / io(数字输出) /
 * judge(条件判断) / arc(圆弧插补) / macro(大动作点)。
 */
const loading = ref(false)
const list = ref<RobotAction[]>([])
const errorText = ref('')

const detailVisible = ref(false)
const current = ref<RobotAction | null>(null)
const steps = ref<RobotStep[]>([])

interface RobotStep {
  seq?: number
  action: string
  desc?: string
  speed?: number
  repeat?: number
  delayMs?: number
  ioSink?: string
  ioIndex?: number
  ioValue?: boolean
  judgeSink?: string
  judgeIndex?: number
  judgeExpect?: boolean
  judgeOnFalse?: string
  judgeSkipSteps?: number
  arcStartId?: string
  arcViaId?: string
  arcEndId?: string
  arcAngle?: number
  targetSequenceName?: string
  moveType?: string
}

async function load(): Promise<void> {
  loading.value = true
  errorText.value = ''
  try {
    list.value = await http.get<RobotAction[]>('/actions')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function openDetail(row: RobotAction): void {
  current.value = row
  try {
    steps.value = JSON.parse(row.stepsJson || '[]') as RobotStep[]
  } catch {
    steps.value = []
  }
  detailVisible.value = true
}

function kindLabel(action: string): string {
  switch (action) {
    case 'path': return '录制路径'
    case 'wait': return '延时'
    case 'io': return '数字输出'
    case 'judge': return '条件判断'
    case 'arc': return '圆弧插补'
    case 'macro': return '大动作点'
    default: return '动作点'
  }
}

function sinkLabel(sink?: string): string {
  if (sink === 'std') return '标准'
  if (sink === 'config') return '配置'
  return '工具端'
}

function stepDetail(s: RobotStep): string {
  switch (s.action) {
    case 'wait': return `延时 ${s.delayMs ?? 0} ms`
    case 'path': return `回放 ${s.repeat ?? 1} 次 · 速度 ${s.speed ?? 0}%`
    case 'io': return `${sinkLabel(s.ioSink)} #${s.ioIndex ?? 0} = ${s.ioValue ? 'ON' : 'OFF'}`
    case 'judge':
      return `${sinkLabel(s.judgeSink)} DI${s.judgeIndex ?? 0} = ${s.judgeExpect ? 'ON' : 'OFF'}`
        + (s.judgeOnFalse === 'skip' ? `，否则跳过 ${s.judgeSkipSteps ?? 0} 步` : '，否则中止')
    case 'arc': return `圆心角 ${s.arcAngle ?? 0}°（起点/中点/终点）`
    case 'macro': return `引用序列 ${s.targetSequenceName || '—'}`
    default: return `${s.moveType === 'Linear' ? '直线' : '关节'} · 速度 ${s.speed ?? 0}%`
  }
}

onMounted(load)
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="toolbar">
      <span class="text-secondary text-small">共 {{ list.length }} 条动作（由 PC 控制端上传）</span>
      <div class="toolbar-spacer" />
      <el-button @click="load"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <el-alert v-if="errorText" type="error" :closable="false" :title="errorText" class="mb-4" />

    <el-table v-else :data="list" border stripe @row-click="openDetail">
      <el-table-column prop="actionCode" label="动作编码" min-width="200" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
      <el-table-column label="发布状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.published ? 'success' : 'info'">{{ row.published ? '已发布' : '未发布' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdByAccount" label="创建人" width="120" />
      <el-table-column label="操作" width="110" align="center">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click.stop="openDetail(row)">查看步骤</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="detailVisible" :title="current ? `动作详情 · ${current.name}` : '动作详情'" size="560">
      <template v-if="current">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="动作编码">{{ current.actionCode }}</el-descriptions-item>
          <el-descriptions-item label="说明">{{ current.description || '—' }}</el-descriptions-item>
          <el-descriptions-item label="步数">{{ steps.length }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4 mb-2">动作步骤</h4>
        <el-empty v-if="steps.length === 0" description="无步骤数据" :image-size="80" />
        <el-table v-else :data="steps" size="small" border>
          <el-table-column label="#" width="50" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ kindLabel(row.action) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="名称" min-width="150" show-overflow-tooltip />
          <el-table-column label="参数" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ stepDetail(row) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.mt-4 { margin-top: 16px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
</style>
