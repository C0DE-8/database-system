import { apiClient } from './client'

export function getStatus() {
  return apiClient.get('/monitor/status')
}

export function getLogs(limit = 100) {
  return apiClient.get('/monitor/logs', { params: { limit } })
}

export function getSummary() {
  return apiClient.get('/monitor/summary')
}

export function pingAllProjects() {
  return apiClient.post('/monitor/ping-all')
}
