import http from 'http';
import app from './app';
import { config } from './config';
import { connectRedis } from './db/redis';
import { pool } from './db/postgres';

async function bootstrap() {
  // Test database connection
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected');
    client.release();
  } catch (err) {
    console.error('PostgreSQL connection failed:', err);
    process.exit(1);
  }

  // Connect Redis
  try {
    await connectRedis();
  } catch (err) {
    console.warn('Redis connection failed (non-fatal):', err);
  }

  // Create HTTP server + Socket.IO
  const server = http.createServer(app);

  const { initSocketIO } = await import('./socket');
  initSocketIO(server);
  console.log('Socket.IO initialized');

  // Start class assembly scheduler
  const { startClassAssemblyScheduler } = await import('./scheduler/classAssembly');
  startClassAssemblyScheduler();

  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

bootstrap().catch(console.error);
