/**
 * API 相关类型定义（与后端 DTO 对齐）。
 *
 * 维护约定：后端 application.dto 变更时同步更新；字段命名保持与后端 JSON 一致（驼峰）。
 */

// ══════════════════════ 通用 ══════════════════════

/** 分页元信息。 */
export interface PageMeta {
  page: number
  size: number
  total: number
  totalPages: number
}

/** 统一响应结构。 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
  page?: PageMeta
}

/** 分页请求基类。 */
export interface PageQuery {
  page?: number
  size?: number
}

// ══════════════════════ 鉴权 ══════════════════════

export interface LoginRequest {
  account: string
  password: string
  clientId?: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserInfo
}

export interface UserInfo {
  id: number
  account: string
  name: string
  role: string
  roleName: string
  /** 角色层级（0~4），前端据此控制菜单与按钮可见性 */
  roleLevel: number
  department?: string
  enabled: boolean
  lastLoginAt?: string
  createdAt?: string
}

export interface UserSaveRequest {
  account: string
  name: string
  password?: string
  role: string
  department?: string
  enabled: boolean
  remark?: string
}

export interface UserQuery extends PageQuery {
  keyword?: string
  role?: string
  enabled?: boolean
}

// ══════════════════════ 场景库 ══════════════════════

export interface Scenario {
  id: number
  scenarioCode: string
  name: string
  icon?: string
  description?: string
  category: string
  categoryName: string
  version: string
  status: string
  statusName: string
  estimatedMinutes?: number
  totalExecutions: number
  passRate?: number
  publishedAt?: string
  publishedBy?: string
  updatedAt?: string
}

export interface ScenarioDetail {
  scenario: Scenario
  paramsJson?: string
  stepsJson?: string
  criteriaJson?: string
}

export interface ScenarioSaveRequest {
  scenarioCode: string
  name: string
  icon?: string
  description?: string
  category: string
  paramsJson?: string
  stepsJson?: string
  criteriaJson?: string
  estimatedMinutes?: number
}

export interface ScenarioVersion {
  id: number
  version: string
  isCurrent: boolean
  isRollback: boolean
  changeNote?: string
  createdBy?: string
  createdAt?: string
}

export interface ScenarioLibraryVersion {
  libraryVersion: string
  scenarioCount: number
  lastUpdatedAt?: string
}

// ══════════════════════ 动作库 ══════════════════════

export interface RobotAction {
  id: number
  actionCode: string
  name: string
  actionType?: string
  description?: string
  version: string
  stepsJson?: string
  waypointsJson?: string
  speedOverride: number
  timeoutSeconds: number
  retryCount: number
  published: boolean
  createdByAccount?: string
}

// ══════════════════════ 测试数据 ══════════════════════

export interface TestRecord {
  id: number
  recordCode: string
  deviceSn: string
  deviceModel?: string
  scenarioCode: string
  scenarioName?: string
  scenarioVersion?: string
  result: string
  resultName: string
  testStartAt: string
  testEndAt?: string
  durationSeconds?: number
  cyclesProgress?: string
  operatorAccount?: string
  nodeCode?: string
  exceptionCount: number
  defectCount: number
}

export interface TestRecordDetail {
  record: TestRecord
  /** 操作流水（JSON 数组：时间戳 + 动作 + 结果） */
  operationFlowJson?: string
  reportPath?: string
  defects: Defect[]
}

export interface RecordQuery extends PageQuery {
  from?: string
  to?: string
  deviceSn?: string
  scenarioCode?: string
  result?: string
  operatorAccount?: string
  nodeCode?: string
}

export interface Defect {
  id: number
  defectCode: string
  recordId?: number
  recordCode?: string
  deviceSn: string
  defectType?: string
  description: string
  level: string
  levelName: string
  status: string
  statusName: string
  foundAt: string
  handlerAccount?: string
  handleNote?: string
  closedAt?: string
}

export interface Device {
  id: number
  sn: string
  model: string
  batchNo?: string
  firmwareVersion?: string
  status: string
  statusName: string
  producedAt?: string
  lastTestAt?: string
  lastTestResult?: string
  testCount: number
  shippedAt?: string
  customer?: string
}

// ══════════════════════ 分析 ══════════════════════

export interface AnalysisOverview {
  rangeLabel: string
  from: string
  to: string
  totalRecords: number
  passCount: number
  failCount: number
  interruptCount: number
  passRate: number
  totalDefects: number
  averageDurationSeconds?: number
}

export interface TrendPoint {
  label: string
  total: number
  pass: number
  passRate: number
}

export interface DistributionItem {
  name: string
  code?: string
  count: number
  percentage: number
}

export interface AnalysisData {
  overview: AnalysisOverview
  dailyTrend: TrendPoint[]
  scenarioDistribution: DistributionItem[]
  defectTypeDistribution: DistributionItem[]
}

// ══════════════════════ 追溯 ══════════════════════

export interface TraceNode {
  stage: string
  stageName: string
  title: string
  description?: string
  time?: string
  type: 'production' | 'test' | 'defect' | 'repair' | 'retest' | 'ship'
}

export interface TraceData {
  deviceSn: string
  device?: Device
  nodes: TraceNode[]
  recordCount: number
  defectCount: number
}

// ══════════════════════ 审计 ══════════════════════

export interface AuditLog {
  id: number
  operatedAt: string
  userAccount: string
  userRole?: string
  actionType: string
  actionTypeName: string
  target: string
  detail?: string
  sourceIp?: string
  sourceNode?: string
  success: boolean
  failureReason?: string
}

export interface AuditQuery extends PageQuery {
  from?: string
  to?: string
  userAccount?: string
  actionType?: string
  keyword?: string
}

// ══════════════════════ PC 节点 ══════════════════════

export interface PcNode {
  id: number
  nodeCode: string
  nodeName?: string
  ipAddress?: string
  appVersion?: string
  scenarioCacheVersion?: string
  status: string
  statusName: string
  robotMode?: number
  robotModeName?: string
  robotErrorCode?: number
  lastHeartbeatAt?: string
  currentRecordId?: number
}
