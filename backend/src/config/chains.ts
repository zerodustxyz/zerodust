import {
  mainnet,
  sepolia,
  bsc,
  bscTestnet,
  base,
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  gnosis,
  gnosisChiado,
} from 'viem/chains';
import type { Chain } from 'viem';

export interface ChainConfig {
  chain: Chain;
  name: string;
  nativeToken: string;
  nativeTokenDecimals: number;
  minBalance: bigint; // Minimum balance to sweep (in wei)
  explorerUrl: string;
  rpcEnvKey: string;
  enabled: boolean;
  isTestnet: boolean;
  // BSC requires viem for EIP-7702 (not Foundry cast)
  requiresViem7702: boolean;
}

// Unichain definitions (not in viem yet)
const unichain: Chain = {
  id: 130,
  name: 'Unichain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.unichain.org'] } },
  blockExplorers: { default: { name: 'Uniscan', url: 'https://uniscan.xyz' } },
};

const unichainSepolia: Chain = {
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.unichain.org'] } },
  blockExplorers: { default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' } },
  testnet: true,
};

// All supported chains
export const chains: Record<number, ChainConfig> = {
  // Mainnets
  [mainnet.id]: {
    chain: mainnet,
    name: 'Ethereum',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n, // 0.0001 ETH
    explorerUrl: 'https://etherscan.io',
    rpcEnvKey: 'RPC_URL_ETHEREUM',
    enabled: false, // Disabled until mainnet launch
    isTestnet: false,
    requiresViem7702: false,
  },
  [bsc.id]: {
    chain: bsc,
    name: 'BNB Chain',
    nativeToken: 'BNB',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n, // 0.0001 BNB
    explorerUrl: 'https://bscscan.com',
    rpcEnvKey: 'RPC_URL_BSC',
    enabled: false,
    isTestnet: false,
    requiresViem7702: true, // BSC requires viem for EIP-7702
  },
  [base.id]: {
    chain: base,
    name: 'Base',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://basescan.org',
    rpcEnvKey: 'RPC_URL_BASE',
    enabled: false,
    isTestnet: false,
    requiresViem7702: false,
  },
  [arbitrum.id]: {
    chain: arbitrum,
    name: 'Arbitrum',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://arbiscan.io',
    rpcEnvKey: 'RPC_URL_ARBITRUM',
    enabled: false,
    isTestnet: false,
    requiresViem7702: false,
  },
  [optimism.id]: {
    chain: optimism,
    name: 'Optimism',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcEnvKey: 'RPC_URL_OPTIMISM',
    enabled: false,
    isTestnet: false,
    requiresViem7702: false,
  },
  [polygon.id]: {
    chain: polygon,
    name: 'Polygon',
    nativeToken: 'POL',
    nativeTokenDecimals: 18,
    minBalance: 1000000000000000n, // 0.001 POL (cheaper gas)
    explorerUrl: 'https://polygonscan.com',
    rpcEnvKey: 'RPC_URL_POLYGON',
    enabled: false,
    isTestnet: false,
    requiresViem7702: false,
  },
  [gnosis.id]: {
    chain: gnosis,
    name: 'Gnosis',
    nativeToken: 'xDAI',
    nativeTokenDecimals: 18,
    minBalance: 1000000000000000n, // 0.001 xDAI
    explorerUrl: 'https://gnosisscan.io',
    rpcEnvKey: 'RPC_URL_GNOSIS',
    enabled: false,
    isTestnet: false,
    requiresViem7702: false,
  },
  [unichain.id]: {
    chain: unichain,
    name: 'Unichain',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://uniscan.xyz',
    rpcEnvKey: 'RPC_URL_UNICHAIN',
    enabled: false,
    isTestnet: false,
    requiresViem7702: false,
  },

  // Testnets
  [sepolia.id]: {
    chain: sepolia,
    name: 'Sepolia',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcEnvKey: 'RPC_URL_SEPOLIA',
    enabled: true,
    isTestnet: true,
    requiresViem7702: false,
  },
  [bscTestnet.id]: {
    chain: bscTestnet,
    name: 'BSC Testnet',
    nativeToken: 'tBNB',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://testnet.bscscan.com',
    rpcEnvKey: 'RPC_URL_BSC_TESTNET',
    enabled: true,
    isTestnet: true,
    requiresViem7702: true,
  },
  [baseSepolia.id]: {
    chain: baseSepolia,
    name: 'Base Sepolia',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://sepolia.basescan.org',
    rpcEnvKey: 'RPC_URL_BASE_SEPOLIA',
    enabled: true,
    isTestnet: true,
    requiresViem7702: false,
  },
  [arbitrumSepolia.id]: {
    chain: arbitrumSepolia,
    name: 'Arbitrum Sepolia',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://sepolia.arbiscan.io',
    rpcEnvKey: 'RPC_URL_ARBITRUM_SEPOLIA',
    enabled: true,
    isTestnet: true,
    requiresViem7702: false,
  },
  [optimismSepolia.id]: {
    chain: optimismSepolia,
    name: 'Optimism Sepolia',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    rpcEnvKey: 'RPC_URL_OPTIMISM_SEPOLIA',
    enabled: true,
    isTestnet: true,
    requiresViem7702: false,
  },
  [polygonAmoy.id]: {
    chain: polygonAmoy,
    name: 'Polygon Amoy',
    nativeToken: 'POL',
    nativeTokenDecimals: 18,
    minBalance: 1000000000000000n,
    explorerUrl: 'https://amoy.polygonscan.com',
    rpcEnvKey: 'RPC_URL_POLYGON_AMOY',
    enabled: true,
    isTestnet: true,
    requiresViem7702: false,
  },
  [gnosisChiado.id]: {
    chain: gnosisChiado,
    name: 'Gnosis Chiado',
    nativeToken: 'xDAI',
    nativeTokenDecimals: 18,
    minBalance: 1000000000000000n,
    explorerUrl: 'https://gnosis-chiado.blockscout.com',
    rpcEnvKey: 'RPC_URL_GNOSIS_CHIADO',
    enabled: true,
    isTestnet: true,
    requiresViem7702: false,
  },
  [unichainSepolia.id]: {
    chain: unichainSepolia,
    name: 'Unichain Sepolia',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    minBalance: 100000000000000n,
    explorerUrl: 'https://sepolia.uniscan.xyz',
    rpcEnvKey: 'RPC_URL_UNICHAIN_SEPOLIA',
    enabled: true,
    isTestnet: true,
    requiresViem7702: false,
  },
};

export function getEnabledChains(testnet: boolean = true): ChainConfig[] {
  return Object.values(chains).filter(c => c.enabled && c.isTestnet === testnet);
}

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return chains[chainId];
}

export function isChainSupported(chainId: number): boolean {
  const chain = chains[chainId];
  return chain !== undefined && chain.enabled;
}
