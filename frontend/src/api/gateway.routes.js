import { apiClient } from './client'

export function runGatewayQuery(siteId, apiKey, sql, params = []) {
  return apiClient.post(
    '/gateway/query',
    { sql, params },
    {
      headers: {
        'x-site-id': siteId,
        'x-api-key': apiKey,
      },
    },
  )
}

export function getGatewayStatus(siteId, apiKey) {
  return apiClient.get('/gateway/status', {
    headers: {
      'x-site-id': siteId,
      'x-api-key': apiKey,
    },
  })
}
