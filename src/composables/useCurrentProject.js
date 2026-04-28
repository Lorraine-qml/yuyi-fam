import { computed, ref } from 'vue'

const LS_KEY = 'yuyi-current-project-id'

/** 演示：有权限项目列表，切换后全站数据按项目过滤（可改为接口拉取） */
export const PROJECT_OPTIONS = [
  { id: 'p-huangpu', name: '黄浦机管局' },
  { id: 'p-pudong', name: '浦东机管局' },
  { id: 'p-park', name: '园区管理平台' }
]

const _currentId = ref(
  (typeof localStorage !== 'undefined' && localStorage.getItem(LS_KEY)) || PROJECT_OPTIONS[0].id
)

export function getCurrentProjectId() {
  return _currentId.value
}

export function setCurrentProjectId(id) {
  if (!id || !PROJECT_OPTIONS.some((p) => p.id === id)) return
  _currentId.value = id
  try {
    localStorage.setItem(LS_KEY, id)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yuyi-project-changed', { detail: { id } }))
  }
}

export function useCurrentProject() {
  const currentProject = computed(
    () => PROJECT_OPTIONS.find((p) => p.id === _currentId.value) || PROJECT_OPTIONS[0]
  )
  return {
    projectOptions: PROJECT_OPTIONS,
    currentProjectId: _currentId,
    currentProject,
    setCurrentProjectId
  }
}
