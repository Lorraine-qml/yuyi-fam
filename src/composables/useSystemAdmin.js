import { ref } from 'vue'

/**
 * 演示口径：是否具备「系统级 / 超级管理员」能力（事件分类、系统模板等）。
 * 接入权限后改为读取用户角色或接口。
 */
export const isSystemSuperAdmin = ref(true)

export function useSystemAdmin() {
  return { isSystemSuperAdmin }
}
