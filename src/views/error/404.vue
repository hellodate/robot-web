<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-code">404</div>
    <div class="error-title">页面不存在</div>
    <div class="error-desc">请检查地址是否正确，或返回工作台继续操作</div>
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
