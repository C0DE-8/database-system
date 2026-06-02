import { gatewayClient } from './client'

export function runGatewayQuery(siteId, apiKey, sql, params = []) {
  return gatewayClient.post(
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
  return gatewayClient.get('/gateway/status', {
    headers: {
      'x-site-id': siteId,
      'x-api-key': apiKey,
    },
  })
}
