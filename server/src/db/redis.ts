import { createClient } from 'redis';
import { config } from '../config';

export const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

export async function connectRedis() {
  await redisClient.connect();
  console.log('Redis connected');
}
