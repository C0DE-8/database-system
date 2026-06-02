import { apiClient } from './client'

export function getStatus() {
  return apiClient.get('/api/monitor/status')
}

export function getLogs(limit = 100) {
  return apiClient.get('/api/monitor/logs', { params: { limit } })
}

export function getSummary() {
  return apiClient.get('/api/monitor/summary')
}

export function pingAllProjects() {
  return apiClient.post('/api/monitor/ping-all')
}
