<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { analysisApi } from '@/api/testdata'
import { AnalysisRangeOptions } from '@/constants/enums'
import type { AnalysisData } from '@/types/api'

/**
 * 分析引擎：概览统计 + 趋势 + 分布图表（ECharts）。
 *
 * 图表：通过率趋势（折线）、场景执行分布（横向柱状）、缺陷类型分布（饼图）。
 */
const range = ref('7d')
const loading = ref(false)
const data = ref<AnalysisData | null>(null)

const trendRef = ref<HTMLDivElement>()
const scenarioRef = ref<HTMLDivElement>()
const defectRef = ref<HTMLDivElement>()

let charts: echarts.ECharts[] = []

async function load(): Promise<void> {
  loading.value = true
  try {
    data.value = await analysisApi.analyze({ range: range.value })
    await nextTick()
    renderCharts()
  } finally {
    loading.value = false
  }
}

function renderCharts(): void {
  const d = data.value
  if (!d) return

  // ── 通过率趋势 ──
  if (trendRef.value) {
    const chart = echarts.getInstanceByDom(trendRef.value) ?? echarts.init(trendRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 24, top: 32, bottom: 32 },
      xAxis: { type: 'category', data: d.dailyTrend.map((p) => p.label) },
      yAxis: [
        { type: 'value', name: '测试量', axisLabel: { fontSize: 11 } },
        { type: 'value', name: '通过率(%)', min: 0, max: 100, axisLabel: { fontSize: 11 } },
      ],
      series: [
        { name: '测试量', type: 'bar', data: d.dailyTrend.map((p) => p.total), itemStyle: { color: '#93C5FD' }, barMaxWidth: 32 },
        { name: '通过数', type: 'bar', data: d.dailyTrend.map((p) => p.pass), itemStyle: { color: '#2563EB' }, barMaxWidth: 32 },
        {
          name: '通过率', type: 'line', yAxisIndex: 1, smooth: true,
          data: d.dailyTrend.map((p) => p.passRate),
          itemStyle: { color: '#10B981' }, lineStyle: { width: 2 },
        },
      ],
      legend: { top: 0, itemHeight: 8, textStyle: { fontSize: 11 } },
    })
    charts.push(chart)
  }

  // ── 场景执行分布 ──
  if (scenarioRef.value) {
    const sorted = [...d.scenarioDistribution].sort((a, b) => a.count - b.count)
    const chart = echarts.getInstanceByDom(scenarioRef.value) ?? echarts.init(scenarioRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 130, right: 40, top: 16, bottom: 24 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: sorted.map((i) => i.name), axisLabel: { fontSize: 11 } },
      series: [
        {
          type: 'bar', data: sorted.map((i) => i.count),
          itemStyle: { color: '#2563EB', borderRadius: [0, 4, 4, 0] }, barMaxWidth: 20,
          label: { show: true, position: 'right', fontSize: 11 },
        },
      ],
    })
    charts.push(chart)
  }

  // ── 缺陷类型分布 ──
  if (defectRef.value) {
    const chart = echarts.getInstanceByDom(defectRef.value) ?? echarts.init(defectRef.value)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, itemHeight: 8, textStyle: { fontSize: 11 } },
      series: [
        {
          type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
          data: d.defectTypeDistribution.map((i) => ({ name: i.name, value: i.count })),
          label: { fontSize: 11 },
        },
      ],
    })
    charts.push(chart)
  }
}

function handleResize(): void {
  charts.forEach((c) => c.resize())
}

watch(range, load)

onMounted(() => {
  void load()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach((c) => c.dispose())
  charts = []
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-radio-group v-model="range">
        <el-radio-button v-for="opt in AnalysisRangeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
      <span v-if="data" class="text-secondary text-small">
        {{ data.overview.from?.slice(0, 10) }} ~ {{ data.overview.to?.slice(0, 10) }}
      </span>
      <div class="toolbar-spacer" />
      <el-button @click="load"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <!-- 统计卡 -->
    <el-row v-if="data" :gutter="16" class="mb-4">
      <el-col :span="6">
        <el-card>
          <div class="stat-label">测试总数</div>
          <div class="stat-value">{{ data.overview.totalRecords }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">通过率</div>
          <div class="stat-value" style="color: #10b981">{{ data.overview.passRate }}%</div>
          <div class="text-small text-secondary">
            通过 {{ data.overview.passCount }} / 失败 {{ data.overview.failCount }} / 中断 {{ data.overview.interruptCount }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">缺陷总数</div>
          <div class="stat-value" style="color: #ef4444">{{ data.overview.totalDefects }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">平均耗时</div>
          <div class="stat-value">
            {{ data.overview.averageDurationSeconds ? (data.overview.averageDurationSeconds / 60).toFixed(1) : '—' }}
          </div>
          <div class="text-small text-secondary">分钟</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-card class="mb-4">
      <template #header><span class="card-title">测试量与通过率趋势</span></template>
      <div ref="trendRef" style="height: 280px" />
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header><span class="card-title">场景执行次数</span></template>
          <div ref="scenarioRef" style="height: 260px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span class="card-title">缺陷类型分布</span></template>
          <div ref="defectRef" style="height: 260px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.card-title {
  font-weight: 600;
}
</style>
