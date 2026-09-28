import { defineConfig, presetUno, presetAttributify, presetIcons, transformerDirectives, transformerVariantGroup } from 'unocss'

/**
 * UnoCSS 配置（原子化 CSS）
 *
 * 与团队现有前端项目保持一致，并注入项目设计令牌（与 Web 端原型 v2.0 的 CSS 变量对齐）。
 */
export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],

  transformers: [transformerDirectives(), transformerVariantGroup()],

  theme: {
    colors: {
      // 主色（与设计规范、PC 端原型一致）
      primary: {
        DEFAULT: '#2563EB',
        50: '#EFF6FF',
        100: '#DBEAFE',
        500: '#2563EB',
        600: '#1D4ED8',
        700: '#1E40AF',
      },
      // 功能色
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#06B6D4',
      purple: '#8B5CF6',
      // 中性色（9 级灰度）
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
      },
    },
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
      md: '0 2px 8px 0 rgba(0,0,0,0.08)',
      lg: '0 4px 16px 0 rgba(0,0,0,0.12)',
    },
  },

  shortcuts: {
    // 卡片
    'card-base': 'bg-white rounded-lg shadow-sm p-6',
    // 页面容器
    'page-container': 'p-6 bg-gray-100 min-h-full',
    // 工具栏
    'toolbar-base': 'flex items-center gap-4 mb-4 flex-wrap',
    // 状态标签
    'tag-base': 'inline-flex items-center h-22px px-2 rounded-sm text-xs font-medium',
    // 统计卡
    'stat-card': 'bg-white rounded-lg shadow-sm p-6 flex flex-col',
  },

  safelist: [
    // 动态类名（根据状态拼接）需在白名单中，避免被 purge
    'text-success', 'text-warning', 'text-danger', 'text-info', 'text-gray-500',
    'bg-success', 'bg-warning', 'bg-danger', 'bg-info',
  ],
})
