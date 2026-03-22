import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
 
const VALID_API_KEYS = new Map([
  ['free_chave-exemplo-1', { tier: 'free', owner: 'usuario-teste' }],
  ['pro_chave-exemplo-2', { tier: 'pro', owner: 'usuario-pro' }],
])

const PUBLIC_ROUTES = new Set(['/health'])

declare module 'fastify' {
  interface FastifyRequest {
    apiKeyInfo?: {
      tier: string
      owner: string
      key: string
    }
  }
}

const authPlugin: FastifyPluginAsync = fp(async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const url = request.url

    if (PUBLIC_ROUTES.has(url)) return

    const apiKey = request.headers['x-api-key'] as string | undefined

    if (!apiKey) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Header X-API-Key é obrigatório',
        statusCode: 401,
      })
    }

    const keyInfo = VALID_API_KEYS.get(apiKey)

    if (!keyInfo) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key inválida ou expirada',
        statusCode: 401,
      })
    }

    request.apiKeyInfo = {
      tier: keyInfo.tier,
      owner: keyInfo.owner,
      key: apiKey,
    }

    request.log.info(
      { owner: keyInfo.owner, tier: keyInfo.tier },
      'Request autenticada'
    )
  })

  app.log.info('Plugin de autenticação registrado')
})

export { authPlugin }