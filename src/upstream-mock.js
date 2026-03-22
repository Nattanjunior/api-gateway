import http from 'node:http'

const server = http.createServer((req, res) => {
  console.log(`Upstream recebeu:${req.method}${req.url}`)
  console.log('Headers do gateway:', {
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-request-id': req.headers['x-request-id'],
    'x-api-key-owner': req.headers['x-api-key-owner'],
  })

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    message: 'Resposta do upstream',
    path: req.url,
    method: req.method,
    receivedAt: new Date().toISOString(),
  }))
})

server.listen(4000, () => {
  console.log('Upstream mock rodando em http://localhost:4000')
})
