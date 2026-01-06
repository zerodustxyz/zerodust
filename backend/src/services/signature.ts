import { verifyTypedData, type Address } from 'viem';
import { config } from '../config/index.js';

interface AuthorizationParams {
  user: Address;
  destination: Address;
  maxRelayerCompensation: bigint;
  deadline: bigint;
  nonce: bigint;
  chainId: number;
  signature: `0x${string}`;
}

const DOMAIN = {
  name: 'ZeroDustSweep',
  version: '1',
} as const;

const TYPES = {
  SweepAuthorization: [
    { name: 'user', type: 'address' },
    { name: 'destination', type: 'address' },
    { name: 'maxRelayerCompensation', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export async function verifyAuthorization(params: AuthorizationParams): Promise<boolean> {
  const { user, destination, maxRelayerCompensation, deadline, nonce, chainId, signature } = params;

  try {
    const isValid = await verifyTypedData({
      address: user,
      domain: {
        ...DOMAIN,
        chainId: BigInt(chainId),
        verifyingContract: config.SWEEP_CONTRACT_ADDRESS as Address,
      },
      types: TYPES,
      primaryType: 'SweepAuthorization',
      message: {
        user,
        destination,
        maxRelayerCompensation,
        deadline,
        nonce,
      },
      signature,
    });

    return isValid;
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}

export function buildTypedData(
  chainId: number,
  authorization: {
    user: string;
    destination: string;
    maxRelayerCompensation: string;
    deadline: number;
    nonce: number;
  }
) {
  return {
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
    primaryType: 'SweepAuthorization' as const,
    domain: {
      name: 'ZeroDustSweep',
      version: '1',
      chainId,
      verifyingContract: config.SWEEP_CONTRACT_ADDRESS,
    },
    message: authorization,
  };
}
