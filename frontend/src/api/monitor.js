import { api } from './client'

export async function getSummary() {
  const response = await api.get('/monitor/summary')
  return response.data
}

export async function getStatus() {
  const response = await api.get('/monitor/status')
  return response.data
}

export async function getLogs(limit = 50) {
  const response = await api.get('/monitor/logs', {
    params: { limit },
  })
  return response.data
}

export async function pingAllProjects() {
  const response = await api.post('/monitor/ping-all')
  return response.data
}
