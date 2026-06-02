import { apiClient } from './client'

export function listProjects() {
  return apiClient.get('/projects')
}

export function getProject(siteId) {
  return apiClient.get(`/projects/${encodeURIComponent(siteId)}`)
}

export function createProject(payload) {
  return apiClient.post('/projects', payload)
}

export function updateProject(siteId, payload) {
  return apiClient.put(`/projects/${encodeURIComponent(siteId)}`, payload)
}

export function deleteProject(siteId) {
  return apiClient.delete(`/projects/${encodeURIComponent(siteId)}`)
}

export function pingProject(siteId) {
  return apiClient.post(`/projects/${encodeURIComponent(siteId)}/ping`)
}

export function generateProjectApiKey(siteId, payload) {
  return apiClient.post(`/projects/${encodeURIComponent(siteId)}/keys`, payload)
}

export function deleteProjectApiKey(siteId, keyId) {
  return apiClient.delete(
    `/projects/${encodeURIComponent(siteId)}/keys/${encodeURIComponent(keyId)}`,
  )
}
