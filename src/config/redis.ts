import Redis from 'ioredis'
import { env } from '@/config/env.js'

const RedisClass = Redis as unknown as new (...args: any[]) => any;

export const redis = new RedisClass({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,

  retryStrategy(times: any) {
    if (times > 10) {
      console.error('Redis: não conseguiu reconectar após 10 tentativas')
      return null
    }
    return Math.min(times * 100, 2000)
  },

  lazyConnect: true, 
})

redis.on('error', (error: any) => {
  console.error('Erro na conexão com Redis:', error.message)
})

redis.on('connect', () => {
  console.info('Conectado ao Redis')
})

redis.on('reconnecting', () => {
  console.warn('Reconectando ao Redis...')
})