import fastify from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'


const app = fastify({
  logger: true
})

app.register(
  helmet,
  { contentSecurityPolicy: false }
)

await app.register(cors, {
  origin: "http//localhost:3000/"
})

app.get('/', async (request, reply) => {
  reply.send({ hello: 'world' })
})


const start = async () => {
  try {
    await app.listen({ port: 3000 })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()