# ZeroDust Smart Contracts

Smart contracts for ZeroDust - enabling users to sweep their entire native gas token balance to exactly zero via EIP-7702.

## Contract

### ZeroDustSweep.sol

The main sweep contract that enables EIP-7702 sponsored execution.

**Deployed Address (all chains):** `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC`

**Features:**
- EIP-712 typed data signatures for authorization
- EIP-7702 delegation support
- Nonce tracking to prevent replay attacks
- Deadline enforcement
- Relayer compensation from swept funds
- Atomic execution (all-or-nothing)

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 18+ (for BSC E2E tests)

### Setup

```bash
# Install dependencies
forge install

# Build
forge build

# Run tests
forge test

# Run tests with coverage
forge coverage

# Run extended fuzz tests (CI mode)
forge test --fuzz-runs 10000
```

### Test Coverage

```
| File                  | % Lines     | % Statements | % Branches  | % Funcs    |
|-----------------------|-------------|--------------|-------------|------------|
| src/ZeroDustSweep.sol | 100.00%     | 100.00%      | 100.00%     | 100.00%    |
```

## Deployment

### Deploy to a testnet

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your private key

# Deploy to Sepolia
source .env && forge script script/Deploy.s.sol:Deploy \
    --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
    --broadcast \
    --verify
```

### Deployed Addresses

| Chain | Chain ID | Address | Explorer |
|-------|----------|---------|----------|
| Sepolia | 11155111 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://sepolia.etherscan.io/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |
| Base Sepolia | 84532 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://sepolia.basescan.org/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |
| Arbitrum Sepolia | 421614 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://sepolia.arbiscan.io/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |
| Optimism Sepolia | 11155420 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://sepolia-optimism.etherscan.io/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |
| BSC Testnet | 97 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://testnet.bscscan.com/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |
| Polygon Amoy | 80002 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://amoy.polygonscan.com/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |
| Gnosis Chiado | 10200 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://gnosis-chiado.blockscout.com/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |
| Unichain Sepolia | 1301 | `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` | [View](https://sepolia.uniscan.xyz/address/0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC) |

## E2E Testing

### Run E2E tests on testnets

**For all chains except BSC:**
```bash
export USER_PRIVATE_KEY=0x...  # Test user wallet
export RELAYER_PRIVATE_KEY=0x...  # Relayer wallet with gas
export RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

./script/e2e-test.sh
```

**For BSC Testnet (requires viem):**
```bash
npm install
export PRIVATE_KEY=0x...  # Relayer wallet

node script/bsc-e2e-test.mjs
```

### Multi-chain E2E test
```bash
export PRIVATE_KEY=0x...
./script/e2e-all-chains.sh
```

## BSC Chain-Specific Notes

BSC requires different tooling for EIP-7702 transactions due to `baseFeePerGas: 0`.

**Problem:** Foundry's `cast` cannot construct EIP-7702 transactions on BSC.

**Solution:** Use `viem` with explicit gas parameters:
```typescript
const tx = await walletClient.sendTransaction({
    to: userAddress,
    data: calldata,
    authorizationList: [authorization],
    gas: 200000n,
    maxFeePerGas: 3000000000n,      // 3 gwei
    maxPriorityFeePerGas: 3000000000n
});
```

See `script/bsc-e2e-test.mjs` for a complete example.

## Security

### Audit Status
- Slither static analysis: ✅ No vulnerabilities
- Fuzz testing (10,000 runs): ✅ All tests pass
- Manual security review: ✅ Complete
- External audit: 🔜 Pending (via Optimism/Arbitrum grants)

### Security Features
- Checks-Effects-Interactions pattern
- No reentrancy vulnerabilities
- Integer overflow protection (Solidity 0.8+)
- EIP-712 signature verification
- Nonce replay protection
- Deadline enforcement

## Files

```
contracts/
├── src/
│   └── ZeroDustSweep.sol      # Main contract
├── test/
│   └── ZeroDustSweep.t.sol    # Test suite (32 tests)
├── script/
│   ├── Deploy.s.sol           # Deployment script
│   ├── e2e-test.sh            # E2E test (cast-based)
│   ├── e2e-all-chains.sh      # Multi-chain E2E runner
│   └── bsc-e2e-test.mjs       # BSC E2E test (viem-based)
├── broadcast/                  # Deployment logs
├── foundry.toml               # Foundry config
└── .env.example               # Environment template
```

## License

MIT
