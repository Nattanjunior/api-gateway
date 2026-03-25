# API Gateway

Gateway HTTP com rate limiting distribuído (Sliding Window), autenticação por API key e proxy reverso.

![CI](https://github.com/Nattanjunior/api-gateway/actions/workflows/ci.yml/badge.svg)

## Stack

-**Runtime:** Node.js 20 + TypeScript
-**Framework:** Fastify
-**Cache/Rate Limit:** Redis 7 (Lua Script — Sliding Window)
-**Proxy:** undici
-**Container:** Docker (multi-stage build)
-**CI/CD:** GitHub Actions

## Como rodar localmente

\`\`\`bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/api-gateway

# Instale as dependências
npm install

# Copie e configure o .env
cp .env.example .env

# Suba o Redis
docker compose up -d redis

# Rode em modo desenvolvimento
npm run dev
\`\`\`

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | /health | Não | Health check do gateway |
| * | /v1/* | X-API-Key | Proxy para o upstream |

## Rate Limiting

| Tier | Limite | Janela |
|------|--------|--------|
| Free | 60 req | 1 minuto |
| Pro | 600 req | 1 minuto |

Headers retornados: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`