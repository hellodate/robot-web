<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-code">403</div>
    <div class="error-title">权限不足</div>
    <div class="error-desc">您的账号无权访问该页面，请联系管理员申请权限</div>
    <el-button type="primary" @click="router.push('/dashboard')">返回工作台</el-button>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: $gray-100;
}

.error-code {
  font-family: $font-family-mono;
  font-size: 88px;
  font-weight: 700;
  color: $gray-300;
  line-height: 1;
}

.error-title {
  margin-top: 16px;
  font-size: 20px;
  font-weight: 600;
  color: $gray-700;
}

.error-desc {
  margin: 8px 0 24px;
  font-size: 14px;
  color: $gray-500;
}
</style>
