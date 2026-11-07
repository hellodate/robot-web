<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '@/utils/request'
import type { RobotAction } from '@/types/api'

/**
 * 动作库：展示 PC 控制端上传的机器人动作。
 *
 * stepsJson 由 PC 端序列化后直接落库，步骤类型包含：
 * move(动作点) / path(录制路径) / wait(延时) / io(数字输出) /
 * judge(条件判断) / waitinput(等待输入) / jump(跳转) /
 * suction(吸盘吸取) / suction_release(吸盘释放) / search(下探搜索) /
 * arc(圆弧插补) / macro(大动作点)。
 *
 * 大动作点（macro）在 PC 上传时会展开为 children（引用序列的实际步骤），
 * 这里用树形表格展示；旧版 PC 上传的数据没有 children，会提示重新上传。
 */
const loading = ref(false)
const list = ref<RobotAction[]>([])
const errorText = ref('')

const detailVisible = ref(false)
const current = ref<RobotAction | null>(null)
const steps = ref<StepRow[]>([])
const totalStepCount = ref(0)
const waypointNames = ref<Record<string, string>>({})

interface RobotStep {
  seq?: number
  action: string
  desc?: string
  kindText?: string
  detailText?: string
  speed?: number
  repeat?: number
  delayMs?: number
  timeoutSeconds?: number
  moveType?: string | number
  targetWaypointId?: string
  targetWaypointName?: string
  targetPathId?: string
  targetSequenceName?: string
  binNo?: number
  zOffsetMm?: number
  zStepDownMm?: number
  blendRadiusMm?: number
  ioSink?: string
  ioIndex?: number
  ioValue?: boolean
  judgeSink?: string
  judgeIndex?: number
  judgeExpect?: boolean
  judgeOnFalse?: string
  judgeSkipSteps?: number
  jumpToSeq?: number
  arcAngle?: number
  searchStepMm?: number
  searchMaxTimes?: number
  pulseMs?: number
  waitVacuum?: boolean
  children?: RobotStep[]
  childStepCount?: number
}

/** 表格行：rowKey 用 1 / 1.1 / 1.2 这种层级编号，保证树形表格唯一。 */
interface StepRow extends RobotStep {
  rowKey: string
  children?: StepRow[]
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

function parseWaypoints(json?: string): Record<string, string> {
  const map: Record<string, string> = {}
  try {
    const arr = JSON.parse(json || '[]') as Array<{ id?: string; name?: string }>
    for (const w of arr) {
      if (w?.id) map[w.id] = w.name || w.id
    }
  } catch {
    // 动作点 JSON 损坏时忽略，参数里退化为显示 Id
  }
  return map
}

function normalize(items: RobotStep[], prefix = ''): StepRow[] {
  return items.map((item, index) => {
    const rowKey = prefix ? `${prefix}.${index + 1}` : `${index + 1}`
    const row: StepRow = { ...item, rowKey }
    if (Array.isArray(item.children) && item.children.length > 0) {
      row.children = normalize(item.children, rowKey)
    }
    return row
  })
}

function countSteps(rows: StepRow[]): number {
  return rows.reduce((sum, row) => sum + 1 + countSteps(row.children || []), 0)
}

function openDetail(row: RobotAction): void {
  current.value = row
  waypointNames.value = parseWaypoints(row.waypointsJson)

  let parsed: RobotStep[] = []
  try {
    const raw = JSON.parse(row.stepsJson || '[]') as RobotStep[] | RobotStep | null
    // 兼容单步对象（旧数据/手工写入）与正常数组，避免 items.map 报错
    parsed = Array.isArray(raw) ? raw : raw ? [raw] : []
  } catch {
    parsed = []
  }

  steps.value = normalize(parsed)
  totalStepCount.value = countSteps(steps.value)
  detailVisible.value = true
}

function kindLabel(action?: string): string {
  switch (action) {
    case 'path': return '录制路径'
    case 'wait': return '延时'
    case 'io': return '数字输出'
    case 'judge': return '条件判断'
    case 'waitinput': return '等待输入'
    case 'jump': return '跳转'
    case 'suction': return '吸盘吸取'
    case 'suction_release': return '吸盘释放'
    case 'search': return '下探搜索'
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

/** 目标动作点名称：优先用 PC 上传时带的名称，其次用 waypointsJson 解析。 */
function waypointLabel(s: RobotStep): string {
  return s.targetWaypointName
    || (s.targetWaypointId ? waypointNames.value[s.targetWaypointId] : '')
    || s.targetWaypointId
    || ''
}

function stepDetail(s: RobotStep): string {
  switch (s.action) {
    case 'wait':
      return `延时 ${s.delayMs ?? 0} ms`
    case 'path':
      return `路径 ${s.targetPathId || '—'} · 回放 ${s.repeat ?? 1} 次 · 速度 ${s.speed ?? 0}%`
    case 'io':
      return `${sinkLabel(s.ioSink)} #${s.ioIndex ?? 0} = ${s.ioValue ? 'ON' : 'OFF'}`
    case 'judge':
      return `${sinkLabel(s.judgeSink)} DI${s.judgeIndex ?? 0} = ${s.judgeExpect ? 'ON' : 'OFF'}`
        + (s.judgeOnFalse === 'skip' ? `，否则跳过 ${s.judgeSkipSteps ?? 0} 步` : '，否则中止')
        + (s.jumpToSeq ? `；成立跳第 ${s.jumpToSeq} 步` : '')
    case 'waitinput':
      return `${sinkLabel(s.judgeSink)} DI${s.judgeIndex ?? 0} = ${s.judgeExpect ? 'ON' : 'OFF'}`
        + `（超时 ${s.timeoutSeconds ?? 0}s）`
    case 'jump':
      return `跳转到第 ${s.jumpToSeq ?? 0} 步`
    case 'suction':
      return '工具端 DO0 = ON'
        + (s.waitVacuum ? ` · 等待负压到位（≤${s.timeoutSeconds ?? 0}s）` : ' · 不等待负压')
    case 'suction_release':
      return `工具端 DO0 = OFF · 破真空 ${s.pulseMs ?? 0} ms`
    case 'search':
      return `每步下探 ${s.searchStepMm ?? 0} mm · 最多 ${s.searchMaxTimes ?? 0} 次 · 速度 ${s.speed ?? 0}%`
    case 'arc':
      return `圆心角 ${s.arcAngle ?? 0}° · 起点 ${s.arcStartId || '—'} / 中点 ${s.arcViaId || '—'} / 终点 ${s.arcEndId || '—'}`
    case 'macro':
      return `引用序列 ${s.targetSequenceName || '—'}`
        + (s.children?.length ? ` · 已展开 ${s.children.length} 步` : ' · 子步骤未上传（旧版 PC 上传）')
    default: {
      const parts: string[] = [s.moveType === 'Linear' ? '直线' : '关节', `速度 ${s.speed ?? 0}%`]
      const wp = waypointLabel(s)
      if (wp) parts.push(`→ ${wp}`)
      if (s.binNo) parts.push(`仓 ${s.binNo}`)
      if (s.zOffsetMm) parts.push(`Z${s.zOffsetMm > 0 ? '+' : ''}${s.zOffsetMm}mm`)
      if (s.zStepDownMm) parts.push(`每层下降 ${s.zStepDownMm}mm`)
      if (s.blendRadiusMm) parts.push(`过渡 ${s.blendRadiusMm}mm`)
      return parts.join(' · ')
    }
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

    <el-drawer v-model="detailVisible" :title="current ? `动作详情 · ${current.name}` : '动作详情'" size="720">
      <template v-if="current">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="动作编码" :span="2">{{ current.actionCode }}</el-descriptions-item>
          <el-descriptions-item label="说明" :span="2">{{ current.description || '—' }}</el-descriptions-item>
          <el-descriptions-item label="总步数">
            {{ totalStepCount }} 步<span v-if="steps.length !== totalStepCount">（顶层 {{ steps.length }} 步）</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ current.createdByAccount || '—' }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4 mb-2">动作步骤</h4>
        <el-empty v-if="steps.length === 0" description="无步骤数据" :image-size="80" />
        <el-table
          v-else
          class="step-table"
          :data="steps"
          row-key="rowKey"
          :tree-props="{ children: 'children' }"
          default-expand-all
          size="small"
          border
        >
          <el-table-column label="序号" width="80" align="center">
            <template #default="{ row }">{{ row.rowKey }}</template>
          </el-table-column>
          <el-table-column label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ kindLabel(row.action) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="名称" min-width="180">
            <template #default="{ row }">
              <span>{{ row.desc || row.detailText || row.kindText || '—' }}</span>
              <el-tag
                v-if="row.action === 'macro' && !row.children"
                type="warning"
                size="small"
                class="ml-2"
              >子步骤未上传</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="参数" min-width="260">
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
.ml-2 { margin-left: 8px; }

/* 参数列内容较长，允许换行，避免被省略号截断 */
.step-table :deep(.cell) {
  white-space: normal;
  line-height: 1.6;
  word-break: break-all;
}
</style>
