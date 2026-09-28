<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '@/api/auth'
import { UserRoleLabel } from '@/constants/enums'
import type { UserInfo } from '@/types/api'

/** 用户管理（管理员）：查询、新建、编辑、重置密码、启停用。 */
const loading = ref(false)
const list = ref<UserInfo[]>([])
const page = reactive({ page: 1, size: 20, total: 0 })
const query = reactive({ keyword: '', role: '' })

const dialogVisible = ref(false)
const dialogTitle = ref('新建用户')
const form = reactive({
  id: 0, account: '', name: '', password: '', role: 'TESTER', department: '', enabled: true, remark: '',
})

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await userApi.page({ ...query, ...page })
    list.value = res.list
    page.total = res.page.total
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  dialogTitle.value = '新建用户'
  Object.assign(form, { id: 0, account: '', name: '', password: '', role: 'TESTER', department: '', enabled: true, remark: '' })
  dialogVisible.value = true
}

function openEdit(row: UserInfo): void {
  dialogTitle.value = '编辑用户'
  Object.assign(form, {
    id: row.id, account: row.account, name: row.name, password: '',
    role: row.role, department: row.department ?? '', enabled: row.enabled, remark: '',
  })
  dialogVisible.value = true
}

async function handleSave(): Promise<void> {
  if (!form.account.trim() || !form.name.trim()) {
    ElMessage.warning('账号与姓名必填')
    return
  }
  if (form.id === 0 && !form.password) {
    ElMessage.warning('新建用户需设置初始密码')
    return
  }
  const payload = { ...form, password: form.password || undefined }
  if (form.id > 0) {
    await userApi.update(form.id, payload as never)
    ElMessage.success('已保存')
  } else {
    await userApi.create(payload as never)
    ElMessage.success('已创建')
  }
  dialogVisible.value = false
  await load()
}

async function resetPassword(row: UserInfo): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认重置「${row.name}」的密码？`, '提示', { type: 'warning' })
    const newPwd = await userApi.resetPassword(row.id)
    await ElMessageBox.alert(`新密码：${newPwd}（仅本次可见，请立即告知用户）`, '密码已重置', { confirmButtonText: '我已记录' })
    await load()
  } catch {
    // 取消
  }
}

async function toggle(row: UserInfo): Promise<void> {
  await userApi.toggleEnabled(row.id, !row.enabled)
  ElMessage.success(row.enabled ? '已停用' : '已启用')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="page-container">
    <div class="toolbar">
      <el-input v-model="query.keyword" placeholder="账号 / 姓名" clearable style="width: 220px" @keyup.enter="load" />
      <el-select v-model="query.role" placeholder="角色" clearable style="width: 160px">
        <el-option v-for="(label, key) in UserRoleLabel" :key="key" :label="label" :value="key" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <div class="toolbar-spacer" />
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新建用户</el-button>
    </div>

    <el-card v-loading="loading">
      <el-table :data="list">
        <el-table-column prop="account" label="账号" width="140" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="roleName" label="角色" width="140" />
        <el-table-column prop="department" label="部门" width="140" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最近登录" width="180">
          <template #default="{ row }">
            <span class="text-mono text-small">{{ row.lastLoginAt?.replace('T', ' ').slice(0, 19) ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button text size="small" @click="resetPassword(row)">重置密码</el-button>
            <el-button text :type="row.enabled ? 'danger' : 'success'" size="small" @click="toggle(row)">
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
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
        <el-form-item label="账号" required>
          <el-input v-model="form.account" :disabled="form.id > 0" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item :label="form.id > 0 ? '新密码' : '初始密码'" :required="form.id === 0">
          <el-input v-model="form.password" type="password" show-password :placeholder="form.id > 0 ? '留空表示不修改' : '至少 8 位'" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" style="width: 100%">
            <el-option v-for="(label, key) in UserRoleLabel" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门"><el-input v-model="form.department" /></el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
