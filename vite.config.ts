import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'node:path'

/**
 * Vite 配置
 *
 * 关键设计：
 *  1. 按需自动导入 Element Plus（组件 + API），避免全量引入导致包体积过大
 *  2. 开发环境代理 /api 与 /ws 到后端（避免跨域，前端代码中直接用相对路径）
 *  3. UnoCSS 原子化样式（与团队现有前端项目保持一致）
 *  4. SVG 雪碧图（多色图标）
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_PATH || '/',

    plugins: [
      vue(),

      // 原子化 CSS
      UnoCSS(),

      // Element Plus 按需自动导入（组件 + 组合式 API）
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'types/auto-imports.d.ts',
        eslintrc: { enabled: false },
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'types/components.d.ts',
        dirs: ['src/components'],
        extensions: ['vue'],
        deep: true,
      }),

      // SVG 图标雪碧图
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]',
      }),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '#': fileURLToPath(new URL('./types', import.meta.url)),
      },
    },

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      open: false,
      proxy: {
        // REST API 代理到后端
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
        // WebSocket 代理（一键验证、测试进度推送）
        '/ws': {
          target: env.VITE_WS_TARGET || 'ws://localhost:8080',
          ws: true,
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // 拆包：按依赖体积分组，提升缓存命中率
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            elementPlus: ['element-plus', '@element-plus/icons-vue'],
            echarts: ['echarts'],
            utils: ['axios', 'dayjs', 'lodash-es'],
          },
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
    },

    // 依赖预构建优化
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios', 'dayjs', 'element-plus', 'echarts'],
    },
  }
})
