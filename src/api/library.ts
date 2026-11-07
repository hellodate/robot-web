import { http } from '@/utils/request'
import type {
  Scenario,
  ScenarioDetail,
  ScenarioSaveRequest,
  ScenarioVersion,
  ScenarioLibraryVersion,
  RobotAction,
  PcNode,
  PageQuery,
} from '@/types/api'

/**
 * 场景库接口。
 */
export const scenarioApi = {
  /** 分页查询场景。 */
  page(query: PageQuery & { keyword?: string; status?: string; category?: string }) {
    return http.page<Scenario>('/scenarios', query as Record<string, unknown>)
  },

  /** 场景详情（含 JSON 定义）。 */
  detail(id: number) {
    return http.get<ScenarioDetail>(`/scenarios/${id}`)
  },

  /** 新建场景（草稿）。 */
  create(payload: ScenarioSaveRequest) {
    return http.post<Scenario>('/scenarios', payload)
  },

  /** 编辑场景草稿。 */
  update(id: number, payload: ScenarioSaveRequest) {
    return http.put<Scenario>(`/scenarios/${id}`, payload)
  },

  /** 发布场景（生成版本快照）。 */
  publish(id: number, version: string, changeNote?: string) {
    return http.post<Scenario>(`/scenarios/${id}/publish`, { version, changeNote })
  },

  /** 下发场景到指定 PC 节点（WebSocket 通知 PC 立即同步场景库）。 */
  dispatch(id: number, nodeCode: string) {
    return http.post<{ scenarioCode: string; scenarioVersion: string; nodeCode: string; nodeStatus: string }>(
      `/scenarios/${id}/dispatch`,
      { nodeCode },
    )
  },

  /** 远程运行场景：PC 端按场景动作序列驱动机械臂（高风险，需二次确认）。 */
  run(id: number, nodeCode: string) {
    return http.post<{ scenarioCode: string; scenarioVersion: string; nodeCode: string; nodeStatus: string }>(
      `/scenarios/${id}/run`,
      { nodeCode },
    )
  },

  /** 版本历史。 */
  versions(id: number) {
    return http.get<ScenarioVersion[]>(`/scenarios/${id}/versions`)
  },

  /** 回滚到指定版本。 */
  rollback(id: number, versionId: number) {
    return http.post<Scenario>(`/scenarios/${id}/rollback/${versionId}`)
  },

  /** 删除场景（仅草稿）。 */
  remove(id: number) {
    return http.delete<void>(`/scenarios/${id}`)
  },

  /** 场景库版本（PC 端同步比对）。 */
  libraryVersion() {
    return http.get<ScenarioLibraryVersion>('/scenarios/library-version')
  },

  /** 已发布场景全量（PC 端同步）。 */
  sync() {
    return http.get<ScenarioDetail[]>('/scenarios/sync')
  },
}

/**
 * 动作库接口。
 */
export const actionApi = {
  /** 动作列表。 */
  list(publishedOnly = false) {
    return http.get<RobotAction[]>('/actions', { publishedOnly })
  },

  /** 动作详情。 */
  detail(actionCode: string) {
    return http.get<RobotAction>(`/actions/${actionCode}`)
  },

  /** 保存动作（PC 端编程上传）。 */
  save(payload: Partial<RobotAction> & { actionCode: string; name: string }) {
    return http.post<RobotAction>('/actions', payload)
  },

  /** 发布动作。 */
  publish(actionCode: string) {
    return http.post<RobotAction>(`/actions/${actionCode}/publish`)
  },

  /** 删除动作。 */
  remove(actionCode: string) {
    return http.delete<void>(`/actions/${actionCode}`)
  },
}

/**
 * PC 控制端节点接口。
 */
export const nodeApi = {
  /** 节点列表。 */
  list() {
    return http.get<PcNode[]>('/nodes')
  },

  /** 节点注册（PC 端调用）。 */
  register(payload: { nodeCode: string; nodeName?: string; appVersion?: string }) {
    return http.post<PcNode>('/nodes/register', payload)
  },

  /** 节点详情。 */
  detail(nodeCode: string) {
    return http.get<PcNode>(`/nodes/${nodeCode}`)
  },
}
