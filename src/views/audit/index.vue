<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { auditApi } from '@/api/testdata'
import { AuditActionTypeLabel, AuditActionTypeTagType } from '@/constants/enums'
import type { AuditLog } from '@/types/api'

/** 审计日志：全操作留痕查询（管理员）。 */
const loading = ref(false)
const list = ref<AuditLog[]>([])
const page = reactive({ page: 1, size: 20, total: 0 })
const query = reactive({ from: '', to: '', userAccount: '', actionType: '', keyword: '' })

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await auditApi.page({ ...query, ...page })
    list.value = res.list
    page.total = res.page.total
  } finally {
    loading.value = false
  }
}

function reset(): void {
  Object.assign(query, { from: '', to: '', userAccount: '', actionType: '', keyword: '' })
  page.page = 1
  void load()
}

onMounted(load)
</script>

<template>
  <div class="page-container">
    <div class="toolbar">
      <el-date-picker v-model="query.from" type="datetime" placeholder="开始时间" style="width: 180px" value-format="YYYY-MM-DDTHH:mm:ss" />
      <span class="text-secondary">~</span>
      <el-date-picker v-model="query.to" type="datetime" placeholder="结束时间" style="width: 180px" value-format="YYYY-MM-DDTHH:mm:ss" />
      <el-input v-model="query.userAccount" placeholder="操作用户" clearable style="width: 140px" />
      <el-select v-model="query.actionType" placeholder="操作类型" clearable style="width: 150px">
        <el-option v-for="(label, key) in AuditActionTypeLabel" :key="key" :label="label" :value="key" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="关键词" clearable style="width: 160px" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
      <div class="toolbar-spacer" />
      <el-button disabled><el-icon><Download /></el-icon>导出（待实现）</el-button>
    </div>

    <el-card v-loading="loading">
      <el-table :data="list">
        <el-table-column prop="operatedAt" label="时间" width="180">
          <template #default="{ row }">
            <span class="text-mono text-small">{{ row.operatedAt?.replace('T', ' ').slice(0, 19) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="userAccount" label="用户" width="110" />
        <el-table-column prop="userRole" label="角色" width="120" />
        <el-table-column label="操作类型" width="110">
          <template #default="{ row }">
            <el-tag :type="AuditActionTypeTagType[row.actionType] ?? 'info'" size="small" effect="light">
              {{ row.actionTypeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作对象" width="180" show-overflow-tooltip />
        <el-table-column prop="detail" label="详情" show-overflow-tooltip />
        <el-table-column prop="sourceIp" label="来源" width="140">
          <template #default="{ row }">
            <span class="text-mono text-small">{{ row.sourceNode || row.sourceIp || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.success ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.page"
        v-model:page-size="page.size"
        :total="page.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="mt-4"
        @change="load"
      />
    </el-card>
  </div>
</template>
