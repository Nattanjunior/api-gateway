import { buildServer } from '@/server.js'
import { env } from '@/config/env.js'

async function main() {
  const app = await buildServer()

  try {
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    })
  } catch (error) {
    app.log.error(error, 'Erro ao iniciar o servidor')
    process.exit(1)
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  process.exit(1)
})

main()