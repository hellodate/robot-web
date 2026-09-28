<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deviceApi } from '@/api/testdata'
import { DeviceStatusLabel, TestResultLabel, TestResultTagType, UserRoleLevel } from '@/constants/enums'
import { useAuthStore } from '@/stores/auth'
import type { Device } from '@/types/api'

/** 设备台账：查询、新增、编辑、状态变更。 */
const authStore = useAuthStore()
const canEdit = authStore.roleLevel >= UserRoleLevel.TEST_ENGINEER

const loading = ref(false)
const list = ref<Device[]>([])
const page = reactive({ page: 1, size: 20, total: 0 })
const query = reactive({ keyword: '', status: '' })

const dialogVisible = ref(false)
const dialogTitle = ref('新增设备')
const form = reactive({
  id: 0, sn: '', model: '', batchNo: '', firmwareVersion: '',
  producedAt: '', customer: '', remark: '',
})

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await deviceApi.page({ ...query, ...page })
    list.value = res.list
    page.total = res.page.total
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  dialogTitle.value = '新增设备'
  Object.assign(form, { id: 0, sn: '', model: '', batchNo: '', firmwareVersion: '', producedAt: '', customer: '', remark: '' })
  dialogVisible.value = true
}

function openEdit(row: Device): void {
  dialogTitle.value = '编辑设备'
  Object.assign(form, {
    id: row.id, sn: row.sn, model: row.model, batchNo: row.batchNo ?? '',
    firmwareVersion: row.firmwareVersion ?? '', producedAt: row.producedAt ?? '',
    customer: row.customer ?? '', remark: '',
  })
  dialogVisible.value = true
}

async function handleSave(): Promise<void> {
  if (!form.sn.trim() || !form.model.trim()) {
    ElMessage.warning('SN 与型号必填')
    return
  }
  if (form.id > 0) {
    await deviceApi.update(form.id, { ...form })
    ElMessage.success('已保存')
  } else {
    await deviceApi.create({ ...form })
    ElMessage.success('已新增')
  }
  dialogVisible.value = false
  await load()
}

async function changeStatus(row: Device): Promise<void> {
  try {
    const { value } = await ElMessageBox.prompt('请输入目标状态', '变更设备状态', {
      inputValue: row.status,
      inputPlaceholder: Object.keys(DeviceStatusLabel).join(' / '),
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
    await deviceApi.updateStatus(row.id, value)
    ElMessage.success('状态已更新')
    await load()
  } catch {
    // 取消
  }
}

onMounted(load)
</script>

<template>
  <div class="page-container">
    <div class="toolbar">
      <el-input v-model="query.keyword" placeholder="SN / 型号 / 批次" clearable style="width: 240px" @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px">
        <el-option v-for="(label, key) in DeviceStatusLabel" :key="key" :label="label" :value="key" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <div class="toolbar-spacer" />
      <el-button v-if="canEdit" type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新增设备</el-button>
    </div>

    <el-card v-loading="loading">
      <el-table :data="list">
        <el-table-column prop="sn" label="设备 SN" width="160" />
        <el-table-column prop="model" label="型号" width="110" />
        <el-table-column prop="batchNo" label="生产批次" width="170" />
        <el-table-column prop="firmwareVersion" label="固件版本" width="110" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="light">{{ row.statusName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="testCount" label="测试次数" width="90" />
        <el-table-column label="最近结果" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.lastTestResult" :type="TestResultTagType[row.lastTestResult] ?? 'info'" size="small">
              {{ TestResultLabel[row.lastTestResult] ?? row.lastTestResult }}
            </el-tag>
            <span v-else class="text-secondary">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastTestAt" label="最近测试" width="170" />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <template v-if="canEdit">
              <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button text size="small" @click="changeStatus(row)">状态</el-button>
            </template>
            <span v-else class="text-secondary text-small">—</span>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="90px">
        <el-form-item label="设备 SN" required>
          <el-input v-model="form.sn" :disabled="form.id > 0" placeholder="如 SCAN-2026-010" />
        </el-form-item>
        <el-form-item label="型号" required>
          <el-input v-model="form.model" placeholder="如 PP-01 / ND3" />
        </el-form-item>
        <el-form-item label="生产批次"><el-input v-model="form.batchNo" placeholder="如 BATCH-20260901-A" /></el-form-item>
        <el-form-item label="固件版本"><el-input v-model="form.firmwareVersion" placeholder="如 v1.12.6" /></el-form-item>
        <el-form-item label="客户/去向"><el-input v-model="form.customer" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
