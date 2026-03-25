import { buildServer } from '@/server.js'
import { env } from '@/config/env.js'
import { redis } from '@/config/redis.js'

async function main() {
  await redis.connect()

  const app = await buildServer()

  try {
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    })
  } catch (error) {
    app.log.error(error, 'Erro ao iniciar o servidor')
    await redis.quit()
    process.exit(1)
  }

  const shutdown = async (signal: string) => {
    app.log.info(`Recebido${signal}, encerrando servidor...`)
    await app.close()
    await redis.quit()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  process.exit(1)
})

main()