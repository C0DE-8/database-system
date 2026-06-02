import { apiClient } from './client'

export function login(credentials) {
  return apiClient.post('/api/auth/login', credentials)
}
