<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

/**
 * 登录页。
 *
 * 交互：表单校验 → 登录 → 跳转 redirect 参数指定页面或工作台。
 * 首次登录后需修改初始密码（后端返回标记，此处仅提示）。
 */
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  account: '',
  password: '',
})

const rules: FormRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 2, max: 64, message: '账号长度 2~64 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

async function handleLogin(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login({
      account: form.account.trim(),
      password: form.password,
      clientId: 'web',
    })

    ElMessage.success(`欢迎回来，${authStore.userInfo?.name ?? ''}`)

    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    // 错误提示已由 request 拦截器统一处理
    console.warn('[login] 登录失败', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 品牌 -->
      <div class="login-brand">
        <div class="login-logo">🤖</div>
        <h1 class="login-title">拓恩普自动化测试系统</h1>
        <p class="login-sub">Web 管理端 · 场景与数据中心</p>
      </div>

      <!-- 表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" clearable :prefix-icon="'User'" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="'Lock'"
          />
        </el-form-item>

        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
          {{ loading ? '登录中…' : '登 录' }}
        </el-button>
      </el-form>

      <!-- 演示账号提示 -->
      <el-alert type="info" :closable="false" class="login-tip">
        <template #title>
          <div class="tip-title">演示账号（初始密码）</div>
          <div class="tip-list">
            <div><code>admin</code> / Admin@2026 — 管理员（全部权限）</div>
            <div><code>engineer</code> / Engineer@2026 — 测试工程师</div>
            <div><code>robot</code> / Robot@2026 — 机器人工程师</div>
            <div><code>zhangsan</code> / Tester@2026 — 测试员</div>
          </div>
        </template>
      </el-alert>
    </div>

    <div class="login-footer">拓恩普电子（深圳）有限公司 · 自动化测试线体</div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #06b6d4 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 52px;
  line-height: 1;
  margin-bottom: 12px;
}

.login-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: $gray-900;
}

.login-sub {
  margin: 0;
  font-size: 13px;
  color: $gray-500;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
}

.login-tip {
  margin-top: 20px;

  :deep(.el-alert__title) {
    width: 100%;
  }
}

.tip-title {
  font-size: 12px;
  color: $gray-500;
  margin-bottom: 4px;
}

.tip-list {
  font-size: 12px;
  color: $gray-600;
  line-height: 1.9;

  code {
    font-family: $font-family-mono;
    color: $primary-500;
    background: $primary-50;
    padding: 1px 4px;
    border-radius: 3px;
  }
}

.login-footer {
  margin-top: 24px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}
</style>
