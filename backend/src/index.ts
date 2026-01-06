import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { config, isDevelopment } from './config/index.js';
import { chainsRoutes } from './routes/chains.js';
import { balancesRoutes } from './routes/balances.js';
import { quoteRoutes } from './routes/quote.js';
import { sweepRoutes } from './routes/sweep.js';
import { healthRoutes } from './routes/health.js';

const app = Fastify({
  logger: {
    level: isDevelopment ? 'debug' : 'info',
    transport: isDevelopment
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// Register plugins
await app.register(cors, {
  origin: isDevelopment ? true : ['https://zerodust.xyz', 'https://app.zerodust.xyz'],
  credentials: true,
});

await app.register(swagger, {
  openapi: {
    info: {
      title: 'ZeroDust API',
      description: 'API for ZeroDust - sweep native gas tokens to zero via EIP-7702',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://api.zerodust.xyz', description: 'Production' },
    ],
    tags: [
      { name: 'chains', description: 'Chain information' },
      { name: 'balances', description: 'Balance queries' },
      { name: 'quote', description: 'Quote generation' },
      { name: 'sweep', description: 'Sweep execution' },
      { name: 'health', description: 'Health checks' },
    ],
  },
});

await app.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
});

// Register routes
await app.register(healthRoutes, { prefix: '/v1' });
await app.register(chainsRoutes, { prefix: '/v1' });
await app.register(balancesRoutes, { prefix: '/v1' });
await app.register(quoteRoutes, { prefix: '/v1' });
await app.register(sweepRoutes, { prefix: '/v1' });

// Start server
const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    ZeroDust API                           ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at http://${config.HOST}:${config.PORT}                  ║
║  API docs at http://localhost:${config.PORT}/docs                  ║
║  Environment: ${config.NODE_ENV.padEnd(42)}║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
