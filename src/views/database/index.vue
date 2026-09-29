<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { recordApi, defectApi } from '@/api/testdata'
import { scenarioApi } from '@/api/library'
import {
  TestResultLabel, TestResultTagType, DefectLevelLabel, DefectLevelTagType,
  DefectStatusLabel, DefectStatusTagType, UserRoleLevel,
} from '@/constants/enums'
import { useAuthStore } from '@/stores/auth'
import type { Defect, Scenario, TestRecord, TestRecordDetail } from '@/types/api'

/**
 * 测试数据库：执行记录 + 缺陷记录双 Tab。
 *
 * 功能：多条件筛选、表格分页、记录详情抽屉（操作流水/关联缺陷）、缺陷状态流转。
 *
 * 说明：原「关键指标」表已移除 —— 其数据（SOH / 充电电压上限等）属电池充放电语义，
 *       本线体只驱动机械臂做自动化操作，无从获取。被测设备的测试项与上传数据将另行设计。
 */
const authStore = useAuthStore()
const canHandleDefect = authStore.roleLevel >= UserRoleLevel.TEST_ENGINEER

const activeTab = ref<'records' | 'defects'>('records')
const loading = ref(false)
const scenarios = ref<Scenario[]>([])

// ── 执行记录 ──
const records = ref<TestRecord[]>([])
const recordPage = reactive({ page: 1, size: 20, total: 0 })
const recordQuery = reactive({ from: '', to: '', deviceSn: '', scenarioCode: '', result: '' })

// ── 缺陷记录 ──
const defects = ref<Defect[]>([])
const defectPage = reactive({ page: 1, size: 20, total: 0 })
const defectQuery = reactive({ status: '', level: '', keyword: '' })

// ── 详情抽屉 ──
const drawerVisible = ref(false)
const detail = ref<TestRecordDetail | null>(null)

async function loadRecords(): Promise<void> {
  loading.value = true
  try {
    const res = await recordApi.page({ ...recordQuery, ...recordPage })
    records.value = res.list
    recordPage.total = res.page.total
  } finally {
    loading.value = false
  }
}

async function loadDefects(): Promise<void> {
  loading.value = true
  try {
    const res = await defectApi.page({ ...defectQuery, ...defectPage })
    defects.value = res.list
    defectPage.total = res.page.total
  } finally {
    loading.value = false
  }
}

async function openDetail(row: TestRecord): Promise<void> {
  drawerVisible.value = true
  detail.value = null
  try {
    detail.value = await recordApi.detail(row.id)
  } catch {
    ElMessage.error('加载详情失败')
  }
}

/** 缺陷状态流转。 */
async function handleDefect(row: Defect): Promise<void> {
  const nextStatus = row.status === 'PENDING' ? 'PROCESSING' : 'CLOSED'
  const label = nextStatus === 'PROCESSING' ? '开始处理' : '关闭缺陷'
  try {
    const { value: note } = await ElMessageBox.prompt('处理说明', label, {
      inputPlaceholder: nextStatus === 'CLOSED' ? '请填写修复措施' : '请填写处理计划',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
    await defectApi.updateStatus(row.id, nextStatus, note)
    ElMessage.success('已更新')
    await loadDefects()
  } catch {
    // 取消
  }
}

onMounted(async () => {
  scenarios.value = (await scenarioApi.page({ page: 1, size: 100 })).list
  await loadRecords()
  // 缺陷数据首次切换到该 Tab 时加载
})
</script>

<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" @tab-change="(name: string) => (name === 'defects' ? loadDefects() : loadRecords())">
      <!-- ══ 执行记录 ══ -->
      <el-tab-pane label="执行记录" name="records">
        <div class="toolbar">
          <el-date-picker v-model="recordQuery.from" type="datetime" placeholder="开始时间" style="width: 180px" value-format="YYYY-MM-DDTHH:mm:ss" />
          <span class="text-secondary">~</span>
          <el-date-picker v-model="recordQuery.to" type="datetime" placeholder="结束时间" style="width: 180px" value-format="YYYY-MM-DDTHH:mm:ss" />
          <el-input v-model="recordQuery.deviceSn" placeholder="设备 SN" clearable style="width: 160px" />
          <el-select v-model="recordQuery.scenarioCode" placeholder="测试场景" clearable style="width: 180px">
            <el-option v-for="s in scenarios" :key="s.scenarioCode" :label="s.name" :value="s.scenarioCode" />
          </el-select>
          <el-select v-model="recordQuery.result" placeholder="结果" clearable style="width: 110px">
            <el-option label="通过" value="PASS" />
            <el-option label="失败" value="FAIL" />
            <el-option label="中断" value="INTERRUPT" />
          </el-select>
          <el-button type="primary" @click="loadRecords">查询</el-button>
          <el-button @click="Object.assign(recordQuery, { from: '', to: '', deviceSn: '', scenarioCode: '', result: '' }); loadRecords()">重置</el-button>
        </div>

        <el-card v-loading="loading">
          <el-table :data="records" @row-click="openDetail">
            <el-table-column prop="recordCode" label="记录编号" width="150" />
            <el-table-column prop="deviceSn" label="设备 SN" width="150" />
            <el-table-column prop="scenarioName" label="测试场景" show-overflow-tooltip />
            <el-table-column label="结果" width="90">
              <template #default="{ row }">
                <el-tag :type="TestResultTagType[row.result] ?? 'info'" size="small" effect="light">
                  {{ TestResultLabel[row.result] ?? row.result }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="cyclesProgress" label="循环" width="90" />
            <el-table-column prop="operatorAccount" label="操作人" width="110" />
            <el-table-column prop="testStartAt" label="测试时间" width="170" />
            <el-table-column label="缺陷" width="70">
              <template #default="{ row }">
                <el-tag v-if="row.defectCount > 0" type="danger" size="small">{{ row.defectCount }}</el-tag>
                <span v-else class="text-secondary">—</span>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="recordPage.page"
            v-model:page-size="recordPage.size"
            :total="recordPage.total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="mt-4"
            @change="loadRecords"
          />
        </el-card>
      </el-tab-pane>

      <!-- ══ 缺陷记录 ══ -->
      <el-tab-pane label="缺陷记录" name="defects">
        <div class="toolbar">
          <el-select v-model="defectQuery.status" placeholder="状态" clearable style="width: 130px">
            <el-option v-for="(label, key) in DefectStatusLabel" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="defectQuery.level" placeholder="级别" clearable style="width: 130px">
            <el-option v-for="(label, key) in DefectLevelLabel" :key="key" :label="label" :value="key" />
          </el-select>
          <el-input v-model="defectQuery.keyword" placeholder="SN / 关键词" clearable style="width: 200px" />
          <el-button type="primary" @click="loadDefects">查询</el-button>
        </div>

        <el-card v-loading="loading">
          <el-table :data="defects">
            <el-table-column prop="defectCode" label="缺陷编号" width="150" />
            <el-table-column prop="deviceSn" label="设备 SN" width="150" />
            <el-table-column prop="recordCode" label="关联记录" width="150" />
            <el-table-column prop="defectType" label="类型" width="110" />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="DefectLevelTagType[row.level] ?? 'info'" size="small">{{ row.levelName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="DefectStatusTagType[row.status] ?? 'info'" size="small" effect="light">
                  {{ row.statusName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="foundAt" label="发现时间" width="170" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button v-if="canHandleDefect && row.status !== 'CLOSED'" text type="primary" size="small" @click="handleDefect(row)">
                  {{ row.status === 'PENDING' ? '处理' : '关闭' }}
                </el-button>
                <span v-else class="text-secondary text-small">—</span>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="defectPage.page"
            v-model:page-size="defectPage.size"
            :total="defectPage.total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="mt-4"
            @change="loadDefects"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 记录详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="执行记录详情" size="560px">
      <div v-if="!detail" v-loading="true" style="height: 200px" />
      <template v-else>
        <el-alert
          :type="detail.record.result === 'PASS' ? 'success' : detail.record.result === 'FAIL' ? 'error' : 'warning'"
          :closable="false"
          class="mb-4"
        >
          <template #title>
            <b>{{ detail.record.resultName }}</b>
            <span class="ml-2 text-small">{{ detail.record.scenarioName }} · {{ detail.record.recordCode }}</span>
          </template>
        </el-alert>

        <el-descriptions :column="2" border size="small" class="mb-4">
          <el-descriptions-item label="设备 SN">{{ detail.record.deviceSn }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ detail.record.deviceModel ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="场景版本">{{ detail.record.scenarioVersion ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="循环进度">{{ detail.record.cyclesProgress ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ detail.record.operatorAccount ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="执行节点">{{ detail.record.nodeCode ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">{{ detail.record.testStartAt }}</el-descriptions-item>
        </el-descriptions>

        <template v-if="detail.defects.length > 0">
          <div class="section-title mt-4">关联缺陷</div>
          <el-table :data="detail.defects" size="small">
            <el-table-column prop="defectCode" label="编号" width="140" />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="statusName" label="状态" width="80" />
          </el-table>
        </template>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
