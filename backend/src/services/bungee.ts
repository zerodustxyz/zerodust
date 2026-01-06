import { config } from '../config/index.js';
import type { Address } from 'viem';

// Bungee dedicated backend
// Docs: https://docs.bungee.exchange/bungee-auto/api-reference/
const BUNGEE_API_BASE = 'https://dedicated-backend.bungee.exchange/api/v1';

// Rate limit: 20 requests per second

function getBungeeHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // x-api-key header (required)
  if (config.BUNGEE_API_KEY) {
    headers['x-api-key'] = config.BUNGEE_API_KEY;
  }

  // affiliate header (required since Sept 29th)
  if (config.BUNGEE_AFFILIATE_ID) {
    headers['affiliate'] = config.BUNGEE_AFFILIATE_ID;
  }

  return headers;
}

interface BungeeQuoteParams {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: Address;
  toTokenAddress: Address;
  amount: bigint;
  userAddress: Address;
}

interface BungeeQuoteResult {
  bridgeFee: string;
  estimatedOutput: string;
  route: unknown; // Full route object for execution
}

export async function getBungeeQuote(params: BungeeQuoteParams): Promise<BungeeQuoteResult> {
  const { fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, userAddress } = params;

  const queryParams = new URLSearchParams({
    fromChainId: fromChainId.toString(),
    toChainId: toChainId.toString(),
    fromTokenAddress,
    toTokenAddress,
    fromAmount: amount.toString(),
    userAddress,
    uniqueRoutesPerBridge: 'true',
    sort: 'output',
    singleTxOnly: 'true',
  });

  const response = await fetch(`${BUNGEE_API_BASE}/quote?${queryParams}`, {
    method: 'GET',
    headers: getBungeeHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bungee API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success || !data.result?.routes?.length) {
    throw new Error('No bridge routes available');
  }

  // Best route (sorted by output)
  const bestRoute = data.result.routes[0];

  // Bridge fee = input - output
  const inputAmount = BigInt(amount);
  const outputAmount = BigInt(bestRoute.toAmount);
  const bridgeFee = inputAmount - outputAmount;

  return {
    bridgeFee: bridgeFee.toString(),
    estimatedOutput: outputAmount.toString(),
    route: bestRoute,
  };
}

interface BungeeBuildTxParams {
  route: unknown;
  senderAddress: Address;
  receiverAddress: Address;
}

interface BungeeTxData {
  txTarget: Address;
  txData: `0x${string}`;
  value: string;
}

export async function getBungeeTxData(params: BungeeBuildTxParams): Promise<BungeeTxData> {
  const { route, senderAddress, receiverAddress } = params;

  const response = await fetch(`${BUNGEE_API_BASE}/build-tx`, {
    method: 'POST',
    headers: {
      ...getBungeeHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route,
      senderAddress,
      receiverAddress,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bungee build-tx error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success || !data.result) {
    throw new Error('Failed to build bridge transaction');
  }

  return {
    txTarget: data.result.txTarget,
    txData: data.result.txData,
    value: data.result.value,
  };
}

interface BungeeStatusParams {
  transactionHash: string;
  fromChainId: number;
  toChainId: number;
}

// Status codes (updated Aug 20th: REFUND_PENDING removed, REFUNDED is now 7)
type BridgeStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

interface BungeeStatusResult {
  status: BridgeStatus;
  destinationTxHash?: string;
  refund?: {
    chainId: number;
    txHash: string;
  } | null;
}

export async function getBungeeStatus(params: BungeeStatusParams): Promise<BungeeStatusResult> {
  const { transactionHash, fromChainId, toChainId } = params;

  const queryParams = new URLSearchParams({
    transactionHash,
    fromChainId: fromChainId.toString(),
    toChainId: toChainId.toString(),
  });

  const response = await fetch(`${BUNGEE_API_BASE}/bridge-status?${queryParams}`, {
    method: 'GET',
    headers: getBungeeHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bungee status error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error('Failed to get bridge status');
  }

  let status: BridgeStatus = 'PENDING';
  if (data.result.destinationTransactionHash) {
    status = 'COMPLETED';
  } else if (data.result.refund) {
    status = 'REFUNDED';
  } else if (data.result.status === 'FAILED') {
    status = 'FAILED';
  }

  return {
    status,
    destinationTxHash: data.result.destinationTransactionHash,
    refund: data.result.refund,
  };
}

export async function getBungeeSupportedChains(): Promise<number[]> {
  const response = await fetch(`${BUNGEE_API_BASE}/supported-chains`, {
    method: 'GET',
    headers: getBungeeHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Bungee supported-chains error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.result) {
    throw new Error('Failed to get supported chains');
  }

  return data.result.map((chain: { chainId: number }) => chain.chainId);
}
