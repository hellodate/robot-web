# autotest-admin-web — 自动化测试系统 Web 管理端

> Vue 3.5 + Vite 6 + TypeScript + Element Plus + Pinia + Vue Router + UnoCSS + ECharts
> 包管理器：pnpm

## 1. 功能模块

| 模块 | 路由 | 权限层级 | 说明 |
|------|------|---------|------|
| 登录 | `/login` | 公开 | 账号密码登录、演示账号提示 |
| 工作台 | `/dashboard` | 访客+ | 全局概览、最近记录、待处理缺陷、节点状态 |
| 场景编辑器 | `/scenario` | 访客+（编辑需 2） | 场景卡片列表、发布、版本历史、回滚 |
| 场景编辑页 | `/scenario/:id/edit` | 测试工程师 | 基础信息 + 参数定义 + 步骤编排 + 判定标准 |
| 测试数据库 | `/database` | 访客+ | 执行记录 / 缺陷记录双 Tab、详情抽屉、缺陷流转 |
| 分析引擎 | `/analysis` | 访客+ | 概览统计 + 趋势/分布图表（ECharts） |
| 追溯系统 | `/trace` | 访客+ | SN 全链路时间线（生产→测试→缺陷→修复→复测→出货） |
| 设备台账 | `/device` | 访客+（编辑需 2） | 设备 CRUD、状态管理 |
| 审计日志 | `/audit` | 管理员 | 全操作留痕查询 |
| 用户管理 | `/user` | 管理员 | 用户 CRUD、密码重置、启停用 |
| 控制端节点 | `/node` | 测试工程师 | PC 节点状态、机械臂模式、心跳监控 |

## 2. 目录结构

```
src/
├── main.ts                    应用入口（Pinia → Router → Element Plus → 指令 → 图标）
├── App.vue                    根组件（Element Plus 中文语言环境）
│
├── api/                       接口层（按业务模块，与后端 Controller 对应）
│   ├── auth.ts                鉴权 + 用户管理
│   ├── library.ts             场景库 + 动作库 + PC 节点
│   └── testdata.ts            记录 + 缺陷 + 设备 + 分析 + 追溯 + 审计
│
├── layouts/                   布局层
│   ├── IndexLayout.vue        主布局（侧边栏 + 顶栏 + 内容区）
│   └── components/
│       ├── SideMenu.vue       侧边菜单（由路由表自动生成）
│       └── TopBar.vue         顶栏（折叠、节点状态、用户信息）
│
├── router/index.ts            路由配置 + 权限守卫（认证 + 角色层级）
├── stores/                    Pinia 状态
│   ├── auth.ts                认证状态（token、用户信息、权限判定）
│   └── app.ts                 界面状态（侧边栏折叠、全局 loading）
│
├── utils/
│   ├── request.ts             HTTP 客户端（axios 封装：令牌注入、统一错误、401 处理）
│   └── storage.ts             存储封装（Cookie 存 token、localStorage 存其他）
│
├── directives/index.ts        权限指令（v-permission / v-role）
├── constants/enums.ts         业务枚举与标签映射（与后端 domain.enums 对齐）
├── types/api.ts               API 类型定义（与后端 DTO 对齐）
│
├── styles/
│   ├── variables.scss         设计令牌（配色/间距/字体/圆角/阴影）
│   └── index.scss             全局样式 + Element Plus 主题微调
│
└── views/                     页面（按业务模块分目录）
    ├── login/                 登录页
    ├── dashboard/             工作台
    ├── scenario/              场景列表 + Editor.vue（编辑页）
    ├── database/              测试数据库
    ├── analysis/              分析引擎
    ├── trace/                 追溯系统
    ├── device/                设备台账
    ├── audit/                 审计日志
    ├── user/                  用户管理
    ├── node/                  控制端节点
    └── error/                 403 / 404
```

## 3. 关键技术设计

### 3.1 权限模型（前端）

角色层级数值化（与后端 `UserRole.level` 对齐），路由 `meta.authLevel` 声明最低层级：

```ts
GUEST = 0  →  访客（只读浏览）
TESTER = 1  →  测试员
TEST_ENGINEER = 2  →  测试工程师
ROBOT_ENGINEER = 3  →  机器人工程师
ADMIN = 4  →  管理员
```

- **路由守卫**：`authStore.roleLevel < to.meta.authLevel` → 跳转 403
- **菜单过滤**：SideMenu 自动隐藏无权限菜单项
- **按钮控制**：`v-permission="2"` 指令按层级移除元素（用 remove 而非 display:none，避免 DOM 绕过）
- **后端兜底**：所有接口另有 `@PreAuthorize` 校验，前端权限仅作体验优化，不作为安全边界

### 3.2 HTTP 客户端（utils/request.ts）

```
请求 → 注入 Bearer 令牌 → 后端返回 { code, message, data, page }
                          ├─ code=0        → 返回 data（或完整响应）
                          ├─ code≠0        → ElMessage 提示 + reject（可 silent 抑制）
                          ├─ HTTP 401      → 清除登录态 + 跳转登录页（并发去重）
                          └─ HTTP 403/500  → 统一错误提示
```

提供 `http.page()` 便捷方法，自动拆分 `data` 与 `page` 分页元信息。

### 3.3 菜单自动生成

SideMenu 读取路由表（`meta.title/icon/group/hidden/authLevel`）生成菜单，避免路由与菜单双份维护。新增页面只需在路由表加一条记录。

### 3.4 图表（分析引擎）

ECharts 按需引入，包含：
- 测试量与通过率趋势（柱状 + 折线双 Y 轴）
- 场景执行次数排行（横向柱状）
- 缺陷类型分布（环形饼图）

图表实例在 `onUnmounted` 中销毁，窗口 resize 时自适应。

## 4. 快速开始

```bash
# 1. 安装依赖（需 pnpm）
pnpm install

# 2. 启动开发服务器（默认 5173，代理 /api 与 /ws 到 8080）
pnpm dev

# 3. 类型检查
pnpm type-check

# 4. 构建
pnpm build:prod        # 生产构建（含类型检查）
pnpm build:stage       # 测试环境构建
```

### 环境变量

| 文件 | 用途 | API 地址 |
|------|------|---------|
| `.env.development` | 本地开发 | `/api` → 代理到 `http://localhost:8080` |
| `.env.staging` | 内网测试 | `http://192.168.6.200:8080/api` |
| `.env.production` | 生产 | `/api`（同源，由 Nginx 反代） |

### 演示账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | Admin@2026 | 管理员（全部菜单） |
| engineer | Engineer@2026 | 测试工程师 |
| robot | Robot@2026 | 机器人工程师 |
| zhangsan / lisi | Tester@2026 | 测试员 |

PIN 码统一 `123456`（启动测试前二次验证）。

## 5. 部署形态

**分离部署（推荐）**：Nginx 托管前端静态产物，反向代理 `/api` 与 `/ws` 到后端。

```nginx
server {
    listen 80;
    server_name autotest.cathaytop.com;

    # 前端静态资源
    root /var/www/autotest-admin-web/dist;
    index index.html;

    # history 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket（一键验证、测试进度）
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

**合并部署（可选）**：前端构建产物复制到后端 `src/main/resources/static/`，由 Spring Boot 一并提供（详见后端 README）。

## 6. 后续待办

- [ ] 场景参数定义的结构化表单（当前为 JSON 文本编辑）
- [ ] 一键验证交互（WebSocket 实时进度推送）
- [ ] 测试报告 PDF 预览与下载
- [ ] 审计日志导出（Excel）
- [ ] 暗色主题（Element Plus 暗色模式 + 设计令牌扩展）
- [ ] 单元测试（Vitest + Vue Test Utils）
- [ ] E2E 测试（Playwright）

---

**维护人**：Frank ｜ **最后更新**：2026-09-28
