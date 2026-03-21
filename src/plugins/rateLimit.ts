import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { readFileSync } from 'fs'
import { join } from 'path'
import { redis } from '@/config/redis.js'
import { env } from '@/config/env.js'

const luaScript = readFileSync(
  join(process.cwd(), 'src/scripts/sliding-window.lua'),
  'utf-8'
)

type ApiTier = 'free' | 'pro'

function getLimitForTier(tier: ApiTier): number {
  const limits: Record<ApiTier, number> = {
    free: env.RATE_LIMIT_MAX_FREE,
    pro: env.RATE_LIMIT_MAX_PRO,
  }
  return limits[tier]
}


function getTierFromApiKey(apiKey: string | undefined): ApiTier {
  if (!apiKey) return 'free'
  return apiKey.startsWith('pro_') ? 'pro' : 'free'
}

// Executa o Lua script no Redis e retorna o resultado
async function checkRateLimit(
  key: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const window = env.RATE_LIMIT_WINDOW_MS

  const result = (await redis.eval(
    luaScript,
    1,           // número de chaves (KEYS)
    key,         // KEYS[1]
    now,         // ARGV[1] - timestamp atual
    window,      // ARGV[2] - janela em ms
    limit        // ARGV[3] - limite máximo
  )) as [number, number]

  return {
    allowed: result[0] === 1,
    remaining: result[1],
  }
}

const rateLimitPlugin: FastifyPluginAsync = fp(async (app) => {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip
    const apiKey = request.headers['x-api-key'] as string | undefined
    const tier = getTierFromApiKey(apiKey)
    const limit = getLimitForTier(tier)

    const rateLimitKey = apiKey
      ? `rl:key:${apiKey}`
      : `rl:ip:${ip}`

    const { allowed, remaining } = await checkRateLimit(rateLimitKey, limit)

    reply.headers({
      'X-RateLimit-Limit': limit,
      'X-RateLimit-Remaining': Math.max(0, remaining),
      'X-RateLimit-Window': `${env.RATE_LIMIT_WINDOW_MS / 1000}s`,
    })

    if (!allowed) {
      const retryAfter = Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000)

      reply.headers({ 'Retry-After': retryAfter })

      return reply.status(429).send({
        error: 'Too Many Requests',
        message: `Limite de${limit} requests por${retryAfter} segundos excedido`,
        statusCode: 429,
        retryAfter,
      })
    }
  })

  app.log.info('Plugin de rate limiting registrado')
})

export { rateLimitPlugin }