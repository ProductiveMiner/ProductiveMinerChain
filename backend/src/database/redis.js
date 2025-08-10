const redis = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/redis.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

let redisClient = null;

// Connect to Redis
async function connectRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        lazyConnect: true
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });

    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

// Get Redis client
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

// Set key-value pair
async function set(key, value, ttl = null) {
  try {
    const client = getRedisClient();
    if (ttl) {
      await client.setEx(key, ttl, JSON.stringify(value));
    } else {
      await client.set(key, JSON.stringify(value));
    }
    logger.debug('Redis SET:', { key, ttl });
  } catch (error) {
    logger.error('Redis SET error:', { key, error: error.message });
    throw error;
  }
}

// Get value by key
async function get(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    logger.debug('Redis GET:', { key, found: !!value });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis GET error:', { key, error: error.message });
    throw error;
  }
}

// Delete key
async function del(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    logger.debug('Redis DEL:', { key });
  } catch (error) {
    logger.error('Redis DEL error:', { key, error: error.message });
    throw error;
  }
}

// Check if key exists
async function exists(key) {
  try {
    const client = getRedisClient();
    const result = await client.exists(key);
    logger.debug('Redis EXISTS:', { key, exists: result === 1 });
    return result === 1;
  } catch (error) {
    logger.error('Redis EXISTS error:', { key, error: error.message });
    throw error;
  }
}

// Set hash field
async function hset(key, field, value) {
  try {
    const client = getRedisClient();
    await client.hSet(key, field, JSON.stringify(value));
    logger.debug('Redis HSET:', { key, field });
  } catch (error) {
    logger.error('Redis HSET error:', { key, field, error: error.message });
    throw error;
  }
}

// Get hash field
async function hget(key, field) {
  try {
    const client = getRedisClient();
    const value = await client.hGet(key, field);
    logger.debug('Redis HGET:', { key, field, found: !!value });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis HGET error:', { key, field, error: error.message });
    throw error;
  }
}

// Get all hash fields
async function hgetall(key) {
  try {
    const client = getRedisClient();
    const result = await client.hGetAll(key);
    const parsed = {};
    for (const [field, value] of Object.entries(result)) {
      parsed[field] = JSON.parse(value);
    }
    logger.debug('Redis HGETALL:', { key, fields: Object.keys(parsed) });
    return parsed;
  } catch (error) {
    logger.error('Redis HGETALL error:', { key, error: error.message });
    throw error;
  }
}

// Increment counter
async function incr(key) {
  try {
    const client = getRedisClient();
    const result = await client.incr(key);
    logger.debug('Redis INCR:', { key, result });
    return result;
  } catch (error) {
    logger.error('Redis INCR error:', { key, error: error.message });
    throw error;
  }
}

// Close Redis connection
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  set,
  get,
  del,
  exists,
  hset,
  hget,
  hgetall,
  incr,
  closeRedis
};
