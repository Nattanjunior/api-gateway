local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])


redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

local count = redis.call('ZCARD', key)

if count < limit then

  redis.call('ZADD', key, now, now)

  redis.call('PEXPIRE', key, window)

  return {1, limit - count - 1}
end

return {0, 0}