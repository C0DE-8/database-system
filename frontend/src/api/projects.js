import { api } from './client'

export async function listProjects() {
  const response = await api.get('/projects')
  return response.data
}

export async function getProject(siteId) {
  const response = await api.get(`/projects/${siteId}`)
  return response.data
}

export async function createProject(payload) {
  const response = await api.post('/projects', payload)
  return response.data
}

export async function updateProject(siteId, payload) {
  const response = await api.put(`/projects/${siteId}`, payload)
  return response.data
}

export async function deleteProject(siteId) {
  await api.delete(`/projects/${siteId}`)
}

export async function pingProject(siteId) {
  const response = await api.post(`/projects/${siteId}/ping`)
  return response.data
}

export async function generateProjectApiKey(siteId, payload) {
  const response = await api.post(`/projects/${siteId}/keys`, payload)
  return response.data
}

export async function deleteProjectApiKey(siteId, keyId) {
  await api.delete(`/projects/${siteId}/keys/${keyId}`)
}
