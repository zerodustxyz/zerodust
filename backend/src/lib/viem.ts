import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../config/index.js';
import { chains, type ChainConfig } from '../config/chains.js';

// Relayer account (used for signing transactions)
export const relayerAccount = privateKeyToAccount(config.RELAYER_PRIVATE_KEY as `0x${string}`);

// Cache for public clients
const publicClients = new Map<number, PublicClient>();
const walletClients = new Map<number, WalletClient>();

// Get RPC URL for a chain
function getRpcUrl(chainConfig: ChainConfig): string {
  const envValue = process.env[chainConfig.rpcEnvKey];
  if (envValue) {
    return envValue;
  }
  // Fall back to chain's default RPC
  return chainConfig.chain.rpcUrls.default.http[0] ?? '';
}

// Get or create a public client for a chain
export function getPublicClient(chainId: number): PublicClient {
  const cached = publicClients.get(chainId);
  if (cached) {
    return cached;
  }

  const chainConfig = chains[chainId];
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(getRpcUrl(chainConfig)),
  });

  publicClients.set(chainId, client);
  return client;
}

// Get or create a wallet client for a chain
export function getWalletClient(chainId: number): WalletClient {
  const cached = walletClients.get(chainId);
  if (cached) {
    return cached;
  }

  const chainConfig = chains[chainId];
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const client = createWalletClient({
    account: relayerAccount,
    chain: chainConfig.chain,
    transport: http(getRpcUrl(chainConfig)),
  });

  walletClients.set(chainId, client);
  return client;
}

// Get balance for an address on a chain
export async function getBalance(chainId: number, address: Address): Promise<bigint> {
  const client = getPublicClient(chainId);
  return client.getBalance({ address });
}

// Get balances across all enabled chains
export async function getBalancesAllChains(
  address: Address,
  testnet: boolean = true
): Promise<Map<number, bigint>> {
  const enabledChains = Object.values(chains).filter(
    c => c.enabled && c.isTestnet === testnet
  );

  const results = await Promise.allSettled(
    enabledChains.map(async chainConfig => ({
      chainId: chainConfig.chain.id,
      balance: await getBalance(chainConfig.chain.id, address),
    }))
  );

  const balances = new Map<number, bigint>();
  for (const result of results) {
    if (result.status === 'fulfilled') {
      balances.set(result.value.chainId, result.value.balance);
    }
  }

  return balances;
}

// Get current gas price for a chain
export async function getGasPrice(chainId: number): Promise<bigint> {
  const client = getPublicClient(chainId);
  return client.getGasPrice();
}

// Estimate gas for a sweep transaction
export async function estimateSweepGas(
  _chainId: number,
  _userAddress: Address
): Promise<bigint> {
  // Base gas estimate for sweep transaction
  // Actual estimate will be done during simulation
  const BASE_GAS = 100000n;
  return BASE_GAS;
}
