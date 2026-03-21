-- Sliding Window Rate Limiting
-- Argumentos recebidos do Node.js:
-- KEYS[1] = chave Redis (ex: "rl:ip:192.168.1.1")
-- ARGV[1] = timestamp atual em milissegundos
-- ARGV[2] = tamanho da janela em milissegundos (ex: 60000 para 1 minuto)
-- ARGV[3] = limite máximo de requests

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- Remove todas as entradas FORA da janela (mais antigas que agora - window)
-- ZREMRANGEBYSCORE remove membros com score entre min e max
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Conta quantas requests ainda estão dentro da janela
local count = redis.call('ZCARD', key)

-- Se ainda está abaixo do limite, permite a request
if count < limit then
  -- Adiciona o timestamp atual como nova entrada
  -- score = timestamp, member = timestamp (ambos iguais — usamos ms para unicidade)
  redis.call('ZADD', key, now, now)

  -- Define expiração da chave para limpeza automática
  -- Sem isso, chaves de IPs inativos ficam no Redis para sempre
  redis.call('PEXPIRE', key, window)

  -- Retorna: {1 = permitido, remaining = quantas ainda cabem}
  return {1, limit - count - 1}
end

-- Se excedeu o limite, bloqueia
-- Retorna: {0 = bloqueado, 0 = nenhuma restante}
return {0, 0}