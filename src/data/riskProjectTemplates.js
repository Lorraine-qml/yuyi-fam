import { loadCustomTemplates, saveCustomTemplates } from './riskCustomTemplates'

const V2_KEY = 'yuyi-risk-project-templates-v2'
const DEFAULT_PROJECT = 'p-huangpu'

/**
 * 结构：{ [projectId]: Array<template> }
 */
function readAll() {
  try {
    const raw = localStorage.getItem(V2_KEY)
    if (raw) {
      const o = JSON.parse(raw)
      if (o && typeof o === 'object' && !Array.isArray(o)) return o
    }
  } catch {
    /* ignore */
  }
  const migrated = migrateFromLegacyV1()
  if (Object.keys(migrated).length) {
    try {
      localStorage.setItem(V2_KEY, JSON.stringify(migrated))
    } catch {
      /* ignore */
    }
  }
  return migrated
}

function migrateFromLegacyV1() {
  const old = loadCustomTemplates()
  if (!old.length) return {}
  return { [DEFAULT_PROJECT]: old }
}

function writeAll(data) {
  try {
    localStorage.setItem(V2_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function loadProjectTemplates(projectId) {
  if (!projectId) return []
  const all = readAll()
  return Array.isArray(all[projectId]) ? [...all[projectId]] : []
}

export function saveProjectTemplates(projectId, list) {
  if (!projectId) return
  const all = readAll()
  all[projectId] = list
  writeAll(all)
}

/** 所有项目下的规则模板（扁平），供引用统计等使用 */
export function listAllProjectTemplatesAcrossProjects() {
  const all = readAll()
  const rows = []
  Object.values(all).forEach((arr) => {
    if (Array.isArray(arr)) rows.push(...arr)
  })
  return rows
}
