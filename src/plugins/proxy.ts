import { FastifyPluginAsync } from 'fastify'
import { fetch, Headers } from 'undici'
import { env } from '@/config/env.js'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host', 
])


function filterRequestHeaders(
  headers: Record<string, string | string[] | undefined>
): Record<string, string> {
  const filtered: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue
    if (value === undefined) continue
    filtered[key] = Array.isArray(value) ? value.join(', ') : value
  }

  return filtered
}


const proxyPlugin: FastifyPluginAsync = async (app) => {

  app.all('/*', async (request, reply) => {
    const upstreamPath = request.url.replace(/^\/v1/, '') || '/'
    const upstreamUrl = `${env.UPSTREAM_URL}${upstreamPath}`

    const filteredHeaders = filterRequestHeaders(
      request.headers as Record<string, string>
    )


    const enrichedHeaders = {
      ...filteredHeaders,
      'x-forwarded-for': request.ip,
      'x-forwarded-host': request.hostname,
      'x-forwarded-proto': request.protocol,
      'x-request-id': request.id, 
      'x-gateway-version': '1.0.0',
      ...(request.apiKeyInfo
        ? {
            'x-api-key-owner': request.apiKeyInfo.owner,
            'x-api-key-tier': request.apiKeyInfo.tier,
          }
        : {}),
    }
    
    const hasBody = !['GET', 'HEAD'].includes(request.method)

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: new Headers(enrichedHeaders),
        body: hasBody ? JSON.stringify(request.body) : undefined,

        signal: AbortSignal.timeout(30_000),
      })

      const responseHeaders: Record<string, string> = {}
      upstreamResponse.headers.forEach((value, key) => {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
          responseHeaders[key] = value
        }
      })

      responseHeaders['x-served-by'] = 'api-gateway'

      const responseBody = await upstreamResponse.text()

      return reply
        .status(upstreamResponse.status)
        .headers(responseHeaders)
        .send(responseBody)
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        request.log.warn({ upstreamUrl }, 'Upstream timeout')
        return reply.status(504).send({
          error: 'Gateway Timeout',
          message: 'O serviço upstream não respondeu a tempo',
          statusCode: 504,
        })
      }

      request.log.error({ err: error, upstreamUrl }, 'Erro ao chamar upstream')
      return reply.status(502).send({
        error: 'Bad Gateway',
        message: 'Não foi possível comunicar com o serviço upstream',
        statusCode: 502,
      })
    }
  })

  app.log.info(`Plugin de proxy registrado → upstream:${env.UPSTREAM_URL}`)
}

export { proxyPlugin }