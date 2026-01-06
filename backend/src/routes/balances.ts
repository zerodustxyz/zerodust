import type { FastifyPluginAsync } from 'fastify';
import { getBalancesAllChains, getBalance } from '../lib/viem.js';
import { chains, getEnabledChains, isChainSupported } from '../config/chains.js';
import { formatUnits, type Address } from 'viem';

export const balancesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/balances/:address', {
    schema: {
      tags: ['balances'],
      summary: 'Get balances for an address across all supported chains',
      params: {
        type: 'object',
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
        },
        required: ['address'],
      },
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
            address: { type: 'string' },
            chains: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  chainId: { type: 'number' },
                  name: { type: 'string' },
                  balance: { type: 'string' },
                  balanceFormatted: { type: 'string' },
                  canSweep: { type: 'boolean' },
                  minBalance: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const { address } = request.params as { address: string };
    const { testnet = true } = request.query as { testnet?: boolean };

    const balances = await getBalancesAllChains(address as Address, testnet);
    const enabledChains = getEnabledChains(testnet);

    const chainBalances = enabledChains.map(chainConfig => {
      const balance = balances.get(chainConfig.chain.id) ?? 0n;
      const canSweep = balance >= chainConfig.minBalance;

      return {
        chainId: chainConfig.chain.id,
        name: chainConfig.name,
        nativeToken: chainConfig.nativeToken,
        balance: balance.toString(),
        balanceFormatted: formatUnits(balance, chainConfig.nativeTokenDecimals),
        canSweep,
        minBalance: chainConfig.minBalance.toString(),
      };
    });

    return {
      address,
      chains: chainBalances,
    };
  });

  app.get('/balances/:address/:chainId', {
    schema: {
      tags: ['balances'],
      summary: 'Get balance for an address on a specific chain',
      params: {
        type: 'object',
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          chainId: { type: 'number' },
        },
        required: ['address', 'chainId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            chainId: { type: 'number' },
            name: { type: 'string' },
            balance: { type: 'string' },
            balanceFormatted: { type: 'string' },
            canSweep: { type: 'boolean' },
            minBalance: { type: 'string' },
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
    const { address, chainId } = request.params as { address: string; chainId: number };

    if (!isChainSupported(chainId)) {
      return reply.status(404).send({ error: 'Chain not supported' });
    }

    const chainConfig = chains[chainId]!;
    const balance = await getBalance(chainId, address as Address);
    const canSweep = balance >= chainConfig.minBalance;

    return {
      chainId: chainConfig.chain.id,
      name: chainConfig.name,
      nativeToken: chainConfig.nativeToken,
      balance: balance.toString(),
      balanceFormatted: formatUnits(balance, chainConfig.nativeTokenDecimals),
      canSweep,
      minBalance: chainConfig.minBalance.toString(),
    };
  });
};
