import axios from 'axios'

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://api.dbms.copupbid.com/api'
).replace(/\/$/, '')

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const gatewayClient = axios.create({
  baseURL: API_ORIGIN,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dbmsToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

gatewayClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dbmsToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  },
)

gatewayClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  },
)
