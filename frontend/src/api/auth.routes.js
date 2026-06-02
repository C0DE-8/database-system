import { apiClient } from './client'

export function login(credentials) {
  return apiClient.post('/auth/login', credentials)
}
