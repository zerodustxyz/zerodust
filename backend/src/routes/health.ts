import type { FastifyPluginAsync } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // Basic health check
  app.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  // Readiness check (includes database)
  app.get('/ready', {
    schema: {
      tags: ['health'],
      summary: 'Readiness check (includes database)',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            database: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            database: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    try {
      // Test database connection
      const { error } = await supabaseAdmin.from('sweeps').select('id').limit(1);

      if (error) {
        return reply.status(503).send({
          status: 'error',
          database: 'disconnected',
          error: error.message,
        });
      }

      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return reply.status(503).send({
        status: 'error',
        database: 'disconnected',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
};
