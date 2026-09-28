<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { scenarioApi, actionApi } from '@/api/library'
import type { RobotAction, ScenarioDetail } from '@/types/api'

/**
 * 场景编辑器：基础信息 + 参数定义 + 步骤编排 + 判定标准。
 *
 * 步骤编排引用动作库（三层编程抽象的第二层），支持上移/下移/删除。
 * 已发布场景为只读（后端强制校验，前端同步限制）。
 */
const route = useRoute()
const router = useRouter()

const scenarioId = computed(() => {
  const id = route.params.id as string
  return id === 'new' ? null : Number(id)
})
const isNew = computed(() => scenarioId.value === null)

const loading = ref(false)
const saving = ref(false)
const actions = ref<RobotAction[]>([])
const detail = ref<ScenarioDetail | null>(null)

const readonly = computed(() => detail.value?.scenario.status === 'PUBLISHED')

const form = reactive({
  scenarioCode: '',
  name: '',
  icon: '🧪',
  description: '',
  category: 'OTHER',
  estimatedMinutes: undefined as number | undefined,
})

/** 步骤列表（引用动作库）。 */
const steps = ref<Array<{ seq: number; actionCode: string; desc: string }>>([])

/** 参数定义（JSON 文本编辑，后续可升级为结构化表单）。 */
const paramsJson = ref('[]')
const criteriaJson = ref('[]')

async function load(): Promise<void> {
  loading.value = true
  try {
    actions.value = await actionApi.list(true)

    if (!isNew.value && scenarioId.value !== null) {
      const d = await scenarioApi.detail(scenarioId.value)
      detail.value = d
      Object.assign(form, {
        scenarioCode: d.scenario.scenarioCode,
        name: d.scenario.name,
        icon: d.scenario.icon ?? '🧪',
        description: d.scenario.description ?? '',
        category: d.scenario.category,
        estimatedMinutes: d.scenario.estimatedMinutes,
      })
      paramsJson.value = d.paramsJson || '[]'
      criteriaJson.value = d.criteriaJson || '[]'
      try {
        steps.value = JSON.parse(d.stepsJson || '[]')
      } catch {
        steps.value = []
      }
    }
  } finally {
    loading.value = false
  }
}

function addStep(): void {
  steps.value.push({ seq: steps.value.length + 1, actionCode: '', desc: '' })
}

function removeStep(index: number): void {
  steps.value.splice(index, 1)
  reseq()
}

function moveStep(index: number, delta: number): void {
  const target = index + delta
  if (target < 0 || target >= steps.value.length) return
  const [item] = steps.value.splice(index, 1)
  steps.value.splice(target, 0, item)
  reseq()
}

function reseq(): void {
  steps.value.forEach((s, i) => (s.seq = i + 1))
}

function onActionChange(step: { actionCode: string; desc: string }): void {
  const action = actions.value.find((a) => a.actionCode === step.actionCode)
  if (action && !step.desc) step.desc = action.name
}

/** 校验 JSON 字段格式。 */
function validateJson(text: string, field: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    ElMessage.error(`${field} 不是合法的 JSON`)
    return false
  }
}

async function handleSave(): Promise<void> {
  if (!form.name.trim() || !form.scenarioCode.trim()) {
    ElMessage.warning('场景编码与名称必填')
    return
  }
  if (!validateJson(paramsJson.value, '参数定义') || !validateJson(criteriaJson.value, '判定标准')) return

  saving.value = true
  try {
    const payload = {
      ...form,
      paramsJson: paramsJson.value,
      stepsJson: JSON.stringify(steps.value),
      criteriaJson: criteriaJson.value,
    }

    if (isNew.value) {
      await scenarioApi.create(payload)
      ElMessage.success('场景已创建（草稿）')
    } else {
      await scenarioApi.update(scenarioId.value!, payload)
      ElMessage.success('已保存')
    }
    await router.push('/scenario')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="router.push('/scenario')">
        <el-icon><ArrowLeft /></el-icon>返回列表
      </el-button>
      <span class="editor-title">{{ isNew ? '新建场景' : form.name }}</span>
      <el-tag v-if="readonly" type="success" size="small">已发布（只读）</el-tag>
      <div class="toolbar-spacer" />
      <el-button v-if="!readonly" type="primary" :loading="saving" @click="handleSave">保存草稿</el-button>
    </div>

    <el-row :gutter="16">
      <!-- 左栏：基础信息 -->
      <el-col :span="10">
        <el-card class="mb-4">
          <template #header><span class="card-title">基础信息</span></template>
          <el-form label-width="90px" :disabled="readonly">
            <el-form-item label="场景编码" required>
              <el-input v-model="form.scenarioCode" :disabled="!isNew" placeholder="如 sc_battery_test" />
            </el-form-item>
            <el-form-item label="场景名称" required>
              <el-input v-model="form.name" placeholder="如 电池充放电测试" />
            </el-form-item>
            <el-form-item label="图标">
              <el-input v-model="form.icon" placeholder="emoji" style="width: 100px" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="form.category" style="width: 100%">
                <el-option label="电池类" value="BATTERY" />
                <el-option label="通信类" value="COMMUNICATION" />
                <el-option label="OTA 类" value="OTA" />
                <el-option label="老化类" value="AGING" />
                <el-option label="功能类" value="FUNCTIONAL" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
            <el-form-item label="预计时长">
              <el-input-number v-model="form.estimatedMinutes" :min="1" :max="100000" controls-position="right" />
              <span class="ml-2 text-secondary">分钟</span>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" :rows="3" maxlength="512" show-word-limit />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右栏：步骤编排 -->
      <el-col :span="14">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <span class="card-title">步骤编排（引用动作库）</span>
              <el-button v-if="!readonly" text type="primary" size="small" @click="addStep">
                <el-icon><Plus /></el-icon>添加步骤
              </el-button>
            </div>
          </template>

          <el-empty v-if="steps.length === 0" description="尚未添加步骤" :image-size="80" />
          <div v-for="(step, index) in steps" :key="index" class="step-row">
            <span class="step-seq">{{ step.seq }}</span>
            <el-select v-model="step.actionCode" placeholder="选择动作" style="width: 200px" :disabled="readonly" @change="onActionChange(step)">
              <el-option v-for="a in actions" :key="a.actionCode" :label="a.name" :value="a.actionCode" />
            </el-select>
            <el-input v-model="step.desc" placeholder="步骤说明" style="flex: 1" :disabled="readonly" />
            <template v-if="!readonly">
              <el-button text size="small" :disabled="index === 0" @click="moveStep(index, -1)">
                <el-icon><ArrowUp /></el-icon>
              </el-button>
              <el-button text size="small" :disabled="index === steps.length - 1" @click="moveStep(index, 1)">
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <el-button text type="danger" size="small" @click="removeStep(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </div>
        </el-card>

        <!-- 参数与判定标准 -->
        <el-card>
          <template #header><span class="card-title">参数定义与判定标准（JSON）</span></template>
          <el-tabs>
            <el-tab-pane label="参数定义">
              <el-input v-model="paramsJson" type="textarea" :rows="8" :disabled="readonly" class="code-input" />
            </el-tab-pane>
            <el-tab-pane label="判定标准">
              <el-input v-model="criteriaJson" type="textarea" :rows="8" :disabled="readonly" class="code-input" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.editor-title {
  font-size: 16px;
  font-weight: 600;
  margin-left: 8px;
}

.card-title {
  font-weight: 600;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 6px;
  background-color: $gray-50;
  border-radius: $radius-md;
}

.step-seq {
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  font-size: 12px;
  font-family: $font-family-mono;
  color: #fff;
  background-color: $primary-500;
  border-radius: 50%;
  flex-shrink: 0;
}

.code-input :deep(textarea) {
  font-family: $font-family-mono;
  font-size: 12px;
  line-height: 1.6;
}
</style>
