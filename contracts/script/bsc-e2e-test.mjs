/**
 * BSC Testnet EIP-7702 E2E Test
 * Uses viem for better EIP-7702 transaction support
 *
 * Run: node script/bsc-e2e-test.mjs
 */

import {
    createWalletClient,
    createPublicClient,
    http,
    parseEther,
    formatEther,
    keccak256,
    encodeAbiParameters,
    parseAbiParameters,
    toHex,
    concat,
    encodeFunctionData
} from 'viem';
import { bscTestnet } from 'viem/chains';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

// Contract constants
const SWEEP_CONTRACT = '0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC';
const SWEEP_ABI = [
    {
        name: 'executeSweep',
        type: 'function',
        inputs: [
            {
                name: 'auth',
                type: 'tuple',
                components: [
                    { name: 'user', type: 'address' },
                    { name: 'destination', type: 'address' },
                    { name: 'maxRelayerCompensation', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' }
                ]
            },
            { name: 'signature', type: 'bytes' }
        ],
        outputs: []
    },
    {
        name: 'getNextNonce',
        type: 'function',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view'
    },
    {
        name: 'DOMAIN_SEPARATOR',
        type: 'function',
        inputs: [],
        outputs: [{ type: 'bytes32' }],
        stateMutability: 'view'
    }
];

const SWEEP_AUTHORIZATION_TYPEHASH = keccak256(
    toHex('SweepAuthorization(address user,address destination,uint256 maxRelayerCompensation,uint256 deadline,uint256 nonce)')
);

async function main() {
    console.log('=== BSC Testnet EIP-7702 E2E Test (viem) ===\n');

    // Setup
    const relayerPK = process.env.PRIVATE_KEY;
    if (!relayerPK) {
        console.error('ERROR: PRIVATE_KEY not set');
        process.exit(1);
    }

    const relayerAccount = privateKeyToAccount(relayerPK);
    const userPK = generatePrivateKey();
    const userAccount = privateKeyToAccount(userPK);

    console.log('Relayer:', relayerAccount.address);
    console.log('Test User:', userAccount.address);

    // Create clients
    const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http('https://bsc-testnet-rpc.publicnode.com')
    });

    const relayerWallet = createWalletClient({
        chain: bscTestnet,
        transport: http('https://bsc-testnet-rpc.publicnode.com'),
        account: relayerAccount
    });

    // Check balances
    const relayerBalance = await publicClient.getBalance({ address: relayerAccount.address });
    console.log('Relayer balance:', formatEther(relayerBalance), 'BNB');

    // Step 1: Fund test user
    console.log('\n1. Funding test user with 0.001 BNB...');
    const fundTx = await relayerWallet.sendTransaction({
        to: userAccount.address,
        value: parseEther('0.001')
    });
    await publicClient.waitForTransactionReceipt({ hash: fundTx });

    const userBalance = await publicClient.getBalance({ address: userAccount.address });
    console.log('   User balance:', formatEther(userBalance), 'BNB');

    // Step 2: Get contract data
    const nonce = await publicClient.readContract({
        address: SWEEP_CONTRACT,
        abi: SWEEP_ABI,
        functionName: 'getNextNonce',
        args: [userAccount.address]
    });

    const domainSeparator = await publicClient.readContract({
        address: SWEEP_CONTRACT,
        abi: SWEEP_ABI,
        functionName: 'DOMAIN_SEPARATOR'
    });

    console.log('\n2. Contract data:');
    console.log('   Nonce:', nonce.toString());

    // Step 3: Create authorization
    const maxCompensation = parseEther('0.0001');
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

    const auth = {
        user: userAccount.address,
        destination: relayerAccount.address,
        maxRelayerCompensation: maxCompensation,
        deadline: deadline,
        nonce: nonce
    };

    console.log('\n3. Authorization created');

    // Step 4: Sign EIP-712 authorization
    const structHash = keccak256(
        encodeAbiParameters(
            parseAbiParameters('bytes32, address, address, uint256, uint256, uint256'),
            [SWEEP_AUTHORIZATION_TYPEHASH, auth.user, auth.destination, auth.maxRelayerCompensation, auth.deadline, auth.nonce]
        )
    );

    const digest = keccak256(concat(['0x1901', domainSeparator, structHash]));

    // Sign the raw digest
    const eip712Sig = await userAccount.sign({
        hash: digest
    });

    console.log('4. EIP-712 signature created');

    // Step 5: Sign EIP-7702 authorization
    console.log('\n5. Signing EIP-7702 delegation...');

    const authorization = await relayerWallet.signAuthorization({
        account: userAccount,
        contractAddress: SWEEP_CONTRACT,
    });

    console.log('   Authorization signed');

    // Step 6: Encode calldata
    const calldata = encodeFunctionData({
        abi: SWEEP_ABI,
        functionName: 'executeSweep',
        args: [auth, eip712Sig]
    });

    // Step 7: Execute sweep with EIP-7702
    console.log('\n6. Executing EIP-7702 sweep transaction...');

    try {
        const sweepTx = await relayerWallet.sendTransaction({
            to: userAccount.address,
            data: calldata,
            authorizationList: [authorization],
            gas: 200000n,
            maxFeePerGas: 3000000000n, // 3 gwei
            maxPriorityFeePerGas: 3000000000n // 3 gwei
        });

        console.log('   TX Hash:', sweepTx);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: sweepTx });
        console.log('   Status:', receipt.status);
        console.log('   Gas used:', receipt.gasUsed.toString());
        console.log('   Type:', receipt.type);

        // Verify final balance
        const finalBalance = await publicClient.getBalance({ address: userAccount.address });
        console.log('\n7. Results:');
        console.log('   User final balance:', formatEther(finalBalance), 'BNB');

        if (finalBalance === 0n) {
            console.log('\n   ✓ SUCCESS! User balance is exactly ZERO!');
            console.log('\n   BSC Testnet TX:', `https://testnet.bscscan.com/tx/${sweepTx}`);
        } else {
            console.log('\n   ✗ FAILED - User still has balance:', finalBalance.toString(), 'wei');
        }

    } catch (error) {
        console.error('\n   Error executing sweep:', error.message);
        if (error.details) {
            console.error('   Details:', error.details);
        }
        if (error.shortMessage) {
            console.error('   Short message:', error.shortMessage);
        }
    }
}

main().catch(console.error);
