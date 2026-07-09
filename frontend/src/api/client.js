import axios from 'axios'
import { getToken } from '../token'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://api.dbms.copupbid.com/api'
).replace(/\/$/, '')

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '')

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  },
)
