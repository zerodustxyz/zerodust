import type { FastifyPluginAsync } from 'fastify';
import { chains, getEnabledChains } from '../config/chains.js';
import { config } from '../config/index.js';

export const chainsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/chains', {
    schema: {
      tags: ['chains'],
      summary: 'Get list of supported chains',
      querystring: {
        type: 'object',
        properties: {
          testnet: { type: 'boolean', default: true },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            chains: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  chainId: { type: 'number' },
                  name: { type: 'string' },
                  nativeToken: { type: 'string' },
                  nativeTokenDecimals: { type: 'number' },
                  minBalance: { type: 'string' },
                  contractAddress: { type: 'string' },
                  explorerUrl: { type: 'string' },
                  enabled: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const { testnet = true } = request.query as { testnet?: boolean };
    const enabledChains = getEnabledChains(testnet);

    return {
      chains: enabledChains.map(c => ({
        chainId: c.chain.id,
        name: c.name,
        nativeToken: c.nativeToken,
        nativeTokenDecimals: c.nativeTokenDecimals,
        minBalance: c.minBalance.toString(),
        contractAddress: config.SWEEP_CONTRACT_ADDRESS,
        explorerUrl: c.explorerUrl,
        enabled: c.enabled,
      })),
    };
  });

  app.get('/chains/:chainId', {
    schema: {
      tags: ['chains'],
      summary: 'Get chain details by ID',
      params: {
        type: 'object',
        properties: {
          chainId: { type: 'number' },
        },
        required: ['chainId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            chainId: { type: 'number' },
            name: { type: 'string' },
            nativeToken: { type: 'string' },
            nativeTokenDecimals: { type: 'number' },
            minBalance: { type: 'string' },
            contractAddress: { type: 'string' },
            explorerUrl: { type: 'string' },
            enabled: { type: 'boolean' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { chainId } = request.params as { chainId: number };
    const chainConfig = chains[chainId];

    if (!chainConfig) {
      return reply.status(404).send({ error: 'Chain not found' });
    }

    return {
      chainId: chainConfig.chain.id,
      name: chainConfig.name,
      nativeToken: chainConfig.nativeToken,
      nativeTokenDecimals: chainConfig.nativeTokenDecimals,
      minBalance: chainConfig.minBalance.toString(),
      contractAddress: config.SWEEP_CONTRACT_ADDRESS,
      explorerUrl: chainConfig.explorerUrl,
      enabled: chainConfig.enabled,
    };
  });
};
