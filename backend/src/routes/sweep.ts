import type { FastifyPluginAsync } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';
import { verifyAuthorization } from '../services/signature.js';
import type { SweepStatus, Quote, Sweep } from '../types/database.js';

export const sweepRoutes: FastifyPluginAsync = async (app) => {
  // Create EIP-712 typed data for signing
  app.post('/authorization', {
    schema: {
      tags: ['sweep'],
      summary: 'Create EIP-712 typed data for authorization signing',
      body: {
        type: 'object',
        properties: {
          quoteId: { type: 'string', format: 'uuid' },
        },
        required: ['quoteId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            authorization: {
              type: 'object',
              properties: {
                user: { type: 'string' },
                destination: { type: 'string' },
                maxRelayerCompensation: { type: 'string' },
                deadline: { type: 'number' },
                nonce: { type: 'number' },
              },
            },
            typedData: { type: 'object' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
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
    const { quoteId } = request.body as { quoteId: string };

    // Get quote
    const { data: quoteData, error } = await supabaseAdmin
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (error || !quoteData) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    const quote = quoteData as Quote;

    // Check if quote expired
    if (new Date(quote.expires_at) < new Date()) {
      return reply.status(400).send({ error: 'Quote expired', code: 'QUOTE_EXPIRED' });
    }

    // Build authorization struct
    const authorization = {
      user: quote.user_address,
      destination: quote.destination,
      maxRelayerCompensation: quote.max_relayer_compensation,
      deadline: quote.deadline,
      nonce: quote.nonce,
    };

    // Build EIP-712 typed data
    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        SweepAuthorization: [
          { name: 'user', type: 'address' },
          { name: 'destination', type: 'address' },
          { name: 'maxRelayerCompensation', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      primaryType: 'SweepAuthorization',
      domain: {
        name: 'ZeroDustSweep',
        version: '1',
        chainId: quote.from_chain_id,
        verifyingContract: '0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC',
      },
      message: authorization,
    };

    return {
      authorization,
      typedData,
    };
  });

  // Submit signed authorization to execute sweep
  app.post('/sweep', {
    schema: {
      tags: ['sweep'],
      summary: 'Submit signed authorization to execute sweep',
      body: {
        type: 'object',
        properties: {
          quoteId: { type: 'string', format: 'uuid' },
          signature: { type: 'string', pattern: '^0x[a-fA-F0-9]+$' },
        },
        required: ['quoteId', 'signature'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            sweepId: { type: 'string' },
            status: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { quoteId, signature } = request.body as { quoteId: string; signature: string };

    // Get quote
    const { data: quoteData2, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quoteData2) {
      return reply.status(404).send({ error: 'Quote not found' });
    }

    const quote = quoteData2 as Quote;

    // Check if quote expired
    if (new Date(quote.expires_at) < new Date()) {
      return reply.status(400).send({ error: 'Quote expired', code: 'QUOTE_EXPIRED' });
    }

    // Verify signature
    const isValid = await verifyAuthorization({
      user: quote.user_address as `0x${string}`,
      destination: quote.destination as `0x${string}`,
      maxRelayerCompensation: BigInt(quote.max_relayer_compensation),
      deadline: BigInt(quote.deadline),
      nonce: BigInt(quote.nonce),
      chainId: quote.from_chain_id,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return reply.status(400).send({ error: 'Invalid signature', code: 'INVALID_SIGNATURE' });
    }

    // Create sweep record (status: pending)
    const { data: sweepData, error: sweepError } = await supabaseAdmin
      .from('sweeps')
      .insert({
        quote_id: quoteId,
        user_address: quote.user_address,
        destination: quote.destination,
        from_chain_id: quote.from_chain_id,
        to_chain_id: quote.to_chain_id,
        status: 'pending' as SweepStatus,
      })
      .select()
      .single();

    if (sweepError || !sweepData) {
      app.log.error({ sweepError }, 'Failed to create sweep');
      return reply.status(500).send({ error: 'Failed to create sweep', code: 'INTERNAL_ERROR' });
    }

    const sweep = sweepData as Sweep;

    // Store signature for processing (we'll need a separate table or field for this)
    // For now, the worker will re-fetch the quote and use the signature

    app.log.info({ sweepId: sweep.id, quoteId }, 'Sweep submitted');

    return {
      sweepId: sweep.id,
      status: 'pending',
    };
  });

  // Get sweep status
  app.get('/sweep/:sweepId', {
    schema: {
      tags: ['sweep'],
      summary: 'Get sweep status',
      params: {
        type: 'object',
        properties: {
          sweepId: { type: 'string', format: 'uuid' },
        },
        required: ['sweepId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            sweepId: { type: 'string' },
            status: { type: 'string' },
            txHash: { type: 'string' },
            bridgeTxHash: { type: 'string' },
            amountSent: { type: 'string' },
            destination: { type: 'string' },
            fromChainId: { type: 'number' },
            toChainId: { type: 'number' },
            errorMessage: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
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
    const { sweepId } = request.params as { sweepId: string };

    const { data: sweepData, error } = await supabaseAdmin
      .from('sweeps')
      .select('*')
      .eq('id', sweepId)
      .single();

    if (error || !sweepData) {
      return reply.status(404).send({ error: 'Sweep not found' });
    }

    const sweep = sweepData as Sweep;

    return {
      sweepId: sweep.id,
      status: sweep.status,
      txHash: sweep.tx_hash,
      bridgeTxHash: sweep.bridge_tx_hash,
      amountSent: sweep.amount_sent,
      destination: sweep.destination,
      fromChainId: sweep.from_chain_id,
      toChainId: sweep.to_chain_id,
      errorMessage: sweep.error_message,
      createdAt: sweep.created_at,
      updatedAt: sweep.updated_at,
    };
  });

  // List sweeps for a user
  app.get('/sweeps/:address', {
    schema: {
      tags: ['sweep'],
      summary: 'List sweeps for a user address',
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
          limit: { type: 'number', default: 20, maximum: 100 },
          offset: { type: 'number', default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            sweeps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sweepId: { type: 'string' },
                  status: { type: 'string' },
                  fromChainId: { type: 'number' },
                  toChainId: { type: 'number' },
                  amountSent: { type: 'string' },
                  txHash: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
            total: { type: 'number' },
          },
        },
      },
    },
  }, async (request) => {
    const { address } = request.params as { address: string };
    const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number };

    const { data: sweepsData, error, count } = await supabaseAdmin
      .from('sweeps')
      .select('*', { count: 'exact' })
      .eq('user_address', address.toLowerCase())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { sweeps: [], total: 0 };
    }

    const sweeps = (sweepsData ?? []) as Sweep[];

    return {
      sweeps: sweeps.map(s => ({
        sweepId: s.id,
        status: s.status,
        fromChainId: s.from_chain_id,
        toChainId: s.to_chain_id,
        amountSent: s.amount_sent,
        txHash: s.tx_hash,
        createdAt: s.created_at,
      })),
      total: count ?? 0,
    };
  });
};
