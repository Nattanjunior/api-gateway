import 'dotenv/config'
import { z } from 'zod'

// Schema define QUAIS variáveis existem e QUAL o tipo de cada uma
// Se alguma estiver faltando ou com tipo errado, o processo para aqui
// com uma mensagem de erro clara — antes de qualquer outra coisa rodar
const EnvSchema = z.object({
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10)),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),

  UPSTREAM_URL: z
    .string()
    .url('UPSTREAM_URL deve ser uma URL válida. Ex: http://localhost:4000'),

  REDIS_HOST: z.string().default('localhost'),

  REDIS_PORT: z
    .string()
    .default('6379')
    .transform((val) => parseInt(val, 10)),

  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform((val) => parseInt(val, 10)),

  RATE_LIMIT_MAX_FREE: z
    .string()
    .default('60')
    .transform((val) => parseInt(val, 10)),

  RATE_LIMIT_MAX_PRO: z
    .string()
    .default('600')
    .transform((val) => parseInt(val, 10)),
})

// Tenta parsear process.env com o schema acima
// Se falhar, imprime os erros e encerra o processo imediatamente
const result = EnvSchema.safeParse(process.env)

if (!result.success) {
  console.error('Variáveis de ambiente inválidas:')
  console.error(result.error.flatten().fieldErrors)
  process.exit(1) // encerra com código de erro
}

// Exporta as variáveis já tipadas e validadas
export const env = result.data