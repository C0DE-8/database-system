import { apiClient } from './client'

export function listProjects() {
  return apiClient.get('/api/projects')
}

export function getProject(siteId) {
  return apiClient.get(`/api/projects/${encodeURIComponent(siteId)}`)
}

export function createProject(payload) {
  return apiClient.post('/api/projects', payload)
}

export function updateProject(siteId, payload) {
  return apiClient.put(`/api/projects/${encodeURIComponent(siteId)}`, payload)
}

export function deleteProject(siteId) {
  return apiClient.delete(`/api/projects/${encodeURIComponent(siteId)}`)
}

export function pingProject(siteId) {
  return apiClient.post(`/api/projects/${encodeURIComponent(siteId)}/ping`)
}

export function generateProjectApiKey(siteId, payload) {
  return apiClient.post(`/api/projects/${encodeURIComponent(siteId)}/keys`, payload)
}

export function deleteProjectApiKey(siteId, keyId) {
  return apiClient.delete(
    `/api/projects/${encodeURIComponent(siteId)}/keys/${encodeURIComponent(keyId)}`,
  )
}
