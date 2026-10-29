/**
 * 业务枚举与常量（与后端 domain.enums 保持一致）。
 *
 * 维护约定：后端枚举变更时同步更新本文件；标签文案集中在此处，便于统一调整。
 */

// ══════════════════════ 角色与权限 ══════════════════════

/** 角色权限层级（与后端 UserRole.level 数值对齐）。 */
export const UserRoleLevel = {
  GUEST: 0,
  TESTER: 1,
  TEST_ENGINEER: 2,
  ROBOT_ENGINEER: 3,
  ADMIN: 4,
} as const

/** 角色枚举值 → 显示名。 */
export const UserRoleLabel: Record<string, string> = {
  GUEST: '访客',
  TESTER: '测试员',
  TEST_ENGINEER: '测试工程师',
  ROBOT_ENGINEER: '机器人工程师',
  ADMIN: '管理员',
}

// ══════════════════════ 测试结果 ══════════════════════

export const TestResult = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  INTERRUPT: 'INTERRUPT',
} as const

export const TestResultLabel: Record<string, string> = {
  PASS: '通过',
  FAIL: '失败',
  INTERRUPT: '中断',
}

/** 结果 → Element Plus 标签类型。 */
export const TestResultTagType: Record<string, 'success' | 'danger' | 'warning'> = {
  PASS: 'success',
  FAIL: 'danger',
  INTERRUPT: 'warning',
}

// ══════════════════════ 场景 ══════════════════════

export const ScenarioStatusLabel: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '历史版本',
}

export const ScenarioStatusTagType: Record<string, 'info' | 'success' | 'warning'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'info',
}

export const ScenarioCategoryLabel: Record<string, string> = {
  BATTERY: '电池类',
  COMMUNICATION: '通信类',
  OTA: 'OTA 类',
  AGING: '老化类',
  FUNCTIONAL: '功能类',
  OTHER: '其他',
}

// ══════════════════════ 缺陷 ══════════════════════

export const DefectLevelLabel: Record<string, string> = {
  CRITICAL: '严重',
  GENERAL: '一般',
  MINOR: '轻微',
}

export const DefectLevelTagType: Record<string, 'danger' | 'warning' | 'info'> = {
  CRITICAL: 'danger',
  GENERAL: 'warning',
  MINOR: 'info',
}

export const DefectStatusLabel: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  CLOSED: '已关闭',
}

export const DefectStatusTagType: Record<string, 'danger' | 'warning' | 'success'> = {
  PENDING: 'danger',
  PROCESSING: 'warning',
  CLOSED: 'success',
}

// ══════════════════════ 设备 ══════════════════════

export const DeviceStatusLabel: Record<string, string> = {
  IN_STOCK: '在库待测',
  TESTING: '测试中',
  QUALIFIED: '合格',
  REPAIRING: '待返修',
  SHIPPED: '已出货',
  SCRAPPED: '已报废',
}

// ══════════════════════ PC 节点 ══════════════════════

export const NodeStatusLabel: Record<string, string> = {
  ONLINE_IDLE: '在线空闲',
  ONLINE_BUSY: '在线执行中',
  ONLINE_FAULT: '在线异常',
  OFFLINE: '离线',
}

export const NodeStatusTagType: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  ONLINE_IDLE: 'success',
  ONLINE_BUSY: 'warning',
  ONLINE_FAULT: 'danger',
  OFFLINE: 'info',
}

/** 机械臂模式（与 CGXi SDK RobotModes 对齐）。 */
export const RobotModeLabel: Record<number, string> = {
  0: '已关闭',
  1: '未连接',
  2: '安全确认中',
  3: '启动中',
  4: '控制器空闲',
  5: '固件升级中',
  6: '未上电',
  7: '上电中',
  8: '已上电',
  9: '自由拖动',
  10: '松开抱闸',
  11: '已使能',
  12: '关闭抱闸',
  100: '点动中',
  101: '示教中',
  102: '力控测试',
  103: '就绪',
  104: '程序暂停',
  105: '停止中',
  106: '暂停中',
  107: '停止过渡中',
  108: '减速中',
  109: '运动中',
  110: '运动中(可混合)',
  111: '立即停止',
  112: '保护性停止',
}

/**
 * 需要按告警展示的机械臂模式。
 * 111=立即停止（ImdStop），112=保护性停止（ProtectiveStop，常见于碰撞检测触发）。
 * 这些模式下错误码可能为 0，因此不能只靠 robotErrorCode 判断。
 */
export const RobotModeDangerSet: ReadonlySet<number> = new Set([111, 112])

// ══════════════════════ 审计 ══════════════════════

export const AuditActionTypeLabel: Record<string, string> = {
  LOGIN_LOGOUT: '登录登出',
  TEST_CONTROL: '测试控制',
  SCENARIO_OPS: '场景操作',
  USER_MANAGEMENT: '用户管理',
  SYSTEM_SETTINGS: '系统设置',
  ACTION_PROGRAMMING: '动作编程',
}

export const AuditActionTypeTagType: Record<string, 'info' | 'success' | 'primary' | 'warning' | 'danger'> = {
  LOGIN_LOGOUT: 'info',
  TEST_CONTROL: 'success',
  SCENARIO_OPS: 'primary',
  USER_MANAGEMENT: 'warning',
  SYSTEM_SETTINGS: 'info',
  ACTION_PROGRAMMING: 'primary',
}

// ══════════════════════ 通用 ══════════════════════

/** 分页默认参数。 */
export const PAGE_DEFAULT = {
  page: 1,
  size: 20,
  sizes: [10, 20, 50, 100],
} as const

/** 分析时间范围选项。 */
export const AnalysisRangeOptions = [
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '近 90 天', value: '90d' },
] as const
