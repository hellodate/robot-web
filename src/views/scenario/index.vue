<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scenarioApi } from '@/api/library'
import { useAuthStore } from '@/stores/auth'
import { ScenarioStatusLabel, ScenarioStatusTagType, ScenarioCategoryLabel } from '@/constants/enums'
import { UserRoleLevel, PAGE_DEFAULT } from '@/constants/enums'
import type { Scenario } from '@/types/api'

/**
 * 场景编辑器（场景列表）。
 *
 * 功能：场景卡片列表、搜索筛选、新建、编辑、发布、版本历史、回滚、删除。
 * 权限：编辑/发布需测试工程师（层级 2）及以上。
 */
const router = useRouter()
const authStore = useAuthStore()
const canEdit = authStore.roleLevel >= UserRoleLevel.TEST_ENGINEER

const loading = ref(false)
const list = ref<Scenario[]>([])
const page = reactive({ page: 1, size: 12, total: 0 })
const query = reactive({ keyword: '', status: '', category: '' })

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await scenarioApi.page({ ...query, ...page })
    list.value = res.list
    page.total = res.page.total
  } finally {
    loading.value = false
  }
}

function resetQuery(): void {
  query.keyword = ''
  query.status = ''
  query.category = ''
  page.page = 1
  void load()
}

/** 发布场景。 */
async function handlePublish(scenario: Scenario): Promise<void> {
  try {
    const { value: version } = await ElMessageBox.prompt('请输入版本号', '发布场景', {
      inputValue: bumpVersion(scenario.version),
      inputPattern: /^v?\d+(\.\d+)*$/,
      inputErrorMessage: '版本号格式如 v1.3',
      confirmButtonText: '发布',
      cancelButtonText: '取消',
    })
    const { value: note } = await ElMessageBox.prompt('变更说明（可选）', '发布场景', {
      inputValue: '',
      confirmButtonText: '确认发布',
      cancelButtonText: '取消',
    })
    await scenarioApi.publish(scenario.id, version, note)
    ElMessage.success(`已发布 ${version}`)
    await load()
  } catch {
    // 用户取消
  }
}

/** 版本号自增（v1.2 → v1.3）。 */
function bumpVersion(version: string): string {
  const m = version.match(/^v?(\d+)\.(\d+)$/)
  if (!m) return 'v1.1'
  return `v${m[1]}.${Number(m[2]) + 1}`
}

/** 查看版本历史。 */
async function handleVersions(scenario: Scenario): Promise<void> {
  const versions = await scenarioApi.versions(scenario.id)
  const html = versions
    .map(
      (v) =>
        `<div style="padding:6px 0;border-bottom:1px solid #eee">
          <b>${v.version}</b> ${v.isCurrent ? '<span style="color:#10B981">当前</span>' : ''}
          ${v.isRollback ? '<span style="color:#F59E0B">回滚</span>' : ''}
          <div style="font-size:12px;color:#6B7280">${v.changeNote ?? '无变更说明'} · ${v.createdBy ?? '-'} · ${v.createdAt ?? ''}</div>
        </div>`,
    )
    .join('')
  await ElMessageBox.alert(`<div style="max-height:300px;overflow:auto">${html}</div>`, `${scenario.name} 版本历史`, {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭',
  })
}

/** 删除场景。 */
async function handleDelete(scenario: Scenario): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除场景「${scenario.name}」？仅草稿可删除。`, '提示', { type: 'warning' })
    await scenarioApi.remove(scenario.id)
    ElMessage.success('已删除')
    await load()
  } catch {
    // 用户取消
  }
}

function gotoEdit(id: number): void {
  void router.push(`/scenario/${id}/edit`)
}

onMounted(load)
</script>

<template>
  <div class="page-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input v-model="query.keyword" placeholder="搜索场景名称/编码" clearable style="width: 240px" @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 130px">
        <el-option label="草稿" value="DRAFT" />
        <el-option label="已发布" value="PUBLISHED" />
        <el-option label="历史版本" value="ARCHIVED" />
      </el-select>
      <el-select v-model="query.category" placeholder="分类" clearable style="width: 130px">
        <el-option v-for="(label, key) in ScenarioCategoryLabel" :key="key" :label="label" :value="key" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <div class="toolbar-spacer" />
      <el-button v-if="canEdit" type="primary" @click="router.push('/scenario/new/edit')">
        <el-icon><Plus /></el-icon>新建场景
      </el-button>
    </div>

    <!-- 场景卡片 -->
    <div v-loading="loading">
      <el-empty v-if="list.length === 0" description="暂无场景" />
      <el-row v-else :gutter="16">
        <el-col v-for="s in list" :key="s.id" :span="8" class="mb-4">
          <el-card shadow="hover" class="scenario-card">
            <div class="sc-head">
              <div class="sc-icon">{{ s.icon || '🧪' }}</div>
              <div class="sc-title">
                <div class="sc-name">{{ s.name }}</div>
                <div class="sc-desc">{{ s.description || '无描述' }}</div>
              </div>
            </div>

            <div class="sc-meta">
              <span>版本 {{ s.version }}</span>
              <span>执行 {{ s.totalExecutions }} 次</span>
              <span v-if="s.estimatedMinutes">约 {{ s.estimatedMinutes }} 分钟</span>
            </div>

            <div class="sc-foot">
              <el-tag :type="ScenarioStatusTagType[s.status] ?? 'info'" size="small">
                {{ ScenarioStatusLabel[s.status] ?? s.status }}
              </el-tag>
              <div class="sc-actions">
                <el-button text type="primary" size="small" @click="gotoEdit(s.id)">
                  {{ canEdit ? '编辑' : '查看' }}
                </el-button>
                <el-button text size="small" @click="handleVersions(s)">版本</el-button>
                <el-button v-if="canEdit && s.status !== 'PUBLISHED'" text type="success" size="small" @click="handlePublish(s)">
                  发布
                </el-button>
                <el-button v-if="canEdit && s.status === 'DRAFT'" text type="danger" size="small" @click="handleDelete(s)">
                  删除
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="page.total > 0"
      v-model:current-page="page.page"
      v-model:page-size="page.size"
      :total="page.total"
      :page-sizes="[12, 24, 48]"
      layout="total, sizes, prev, pager, next"
      class="mt-4"
      @change="load"
    />
  </div>
</template>

<style scoped lang="scss">
.scenario-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sc-head {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.sc-icon {
  font-size: 32px;
  line-height: 1.2;
}

.sc-title {
  min-width: 0;
}

.sc-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.sc-desc {
  font-size: 12px;
  color: $gray-500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sc-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: $gray-500;
  padding: 8px 0;
  border-top: 1px solid $gray-100;
  border-bottom: 1px solid $gray-100;
  margin-bottom: 10px;
}

.sc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sc-actions {
  display: flex;
  gap: 2px;
}
</style>
