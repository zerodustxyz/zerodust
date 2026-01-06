# ZeroDust Milestones

## Overview

This document defines the detailed milestones for building ZeroDust. Each milestone has specific deliverables, acceptance criteria, and dependencies. Development follows a sequential approach: Contract → Backend → SDK → Frontend.

---

## Milestone 0: Project Setup

### M0.1: Repository & Development Environment

**Deliverables:**
- [ ] GitHub repository at github.com/zerodustxyz with proper structure
- [ ] Monorepo structure with workspaces (contracts, backend, sdk, frontend)
- [ ] Development tooling configured (ESLint, Prettier, TypeScript)
- [ ] CI/CD pipeline foundation (GitHub Actions)
- [ ] Environment variable templates (.env.example files)
- [ ] Git hooks (Husky) for pre-commit linting

**Acceptance Criteria:**
- Repository is public and properly licensed (MIT)
- All team members can clone, install, and run local dev environment
- CI runs on every PR (lint, type-check)

**Directory Structure:**
```
zerodust/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── contracts/
│   ├── src/
│   ├── test/
│   ├── script/
│   └── foundry.toml
├── backend/
│   ├── src/
│   ├── tests/
│   └── package.json
├── sdk/
│   ├── src/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── docs/
├── Plan.md
├── Milestones.md
├── Claude.md
└── README.md
```

---

## Milestone 1: Smart Contract Development ✅ COMPLETE

> **Status: COMPLETE** (January 2026)
> - Contract deployed to all 8 testnets at deterministic address
> - E2E verified with real EIP-7702 transactions on all chains
> - 100% test coverage achieved

### M1.1: Core Contract Implementation ✅

**Deliverables:**
- [x] `ZeroDustSweep.sol` - Main sweep contract
- [x] ~~`IZeroDustSweep.sol` - Interface definition~~ (embedded in contract)
- [x] EIP-712 typed data structure for authorization signing
- [x] Nonce management (sequential per-user)
- [x] Deadline enforcement
- [x] Compensation calculation and transfer logic

**Acceptance Criteria:**
- ✅ Contract compiles without warnings
- ✅ All functions match the interface specification
- ✅ No external dependencies (pure Solidity 0.8.28)
- ✅ Gas usage documented for all external functions

**Security Requirements:**
- ✅ Checks-effects-interactions pattern enforced
- ✅ No reentrancy vulnerabilities
- ✅ No integer overflow (Solidity 0.8+ native)
- ✅ All state changes emit events

---

### M1.2: Contract Test Suite ✅

**Deliverables:**
- [x] Unit tests for all public functions
- [x] Unit tests for all revert conditions
- [x] Fuzz tests for authorization validation
- [x] Fuzz tests for compensation calculations
- [x] Integration tests simulating full sweep flow
- [x] Gas snapshot tests

**Test Coverage Achieved:**
| Category | Target | Actual |
|----------|--------|--------|
| Line coverage | > 95% | **100%** |
| Branch coverage | > 90% | **100%** |
| Function coverage | 100% | **100%** |

**Acceptance Criteria:**
- ✅ All 32 tests pass
- ✅ Coverage targets exceeded (100% across all metrics)
- ✅ Fuzz tests run with 10,000 iterations
- ✅ No test flakiness

**Test Scenarios:**
```
Unit Tests:
├── executeSweep()
│   ├── succeeds with valid authorization
│   ├── reverts with invalid signature
│   ├── reverts with expired deadline
│   ├── reverts with used nonce
│   ├── reverts with insufficient balance
│   ├── correctly calculates user receives amount
│   └── correctly transfers compensation to relayer
├── isNonceUsed()
│   ├── returns false for unused nonce
│   └── returns true after sweep execution
└── getCurrentNonce()
    └── returns correct next nonce

Fuzz Tests:
├── authorization signature validation
├── compensation never exceeds user balance
└── nonce increments correctly under all inputs

Integration Tests:
├── full same-chain sweep flow
├── multi-sweep sequence (nonce progression)
└── concurrent sweep attempts (one succeeds, others fail)
```

---

### M1.3: Deployment Infrastructure ✅

**Deliverables:**
- [x] CREATE2 factory contract (using Arachnid's 0x4e59b44847b379578588920cA78FbF26c0B4956C)
- [x] Deployment script with deterministic addresses
- [x] Multi-chain deployment script
- [x] Contract verification script (Etherscan, Blockscout)
- [x] Deployed address registry (broadcast/*.json)

**Acceptance Criteria:**
- ✅ Same contract address on all chains: `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC`
- ✅ All deployments verified on block explorers
- ✅ Deployment can be reproduced from clean state

**Deployment Checklist:**
```
For each chain:
[x] Deploy via CREATE2
[x] Verify on block explorer
[x] Test executeSweep with test wallet (E2E)
[x] Record address in registry
[x] Confirm deterministic address matches
```

---

### M1.4: Testnet Deployment ✅

**Deliverables:**
- [x] Contract deployed to Sepolia (Ethereum testnet)
- [x] Contract deployed to BSC Testnet
- [x] Contract deployed to Base Sepolia
- [x] Contract deployed to Optimism Sepolia
- [x] Contract deployed to Arbitrum Sepolia
- [x] Contract deployed to Unichain Sepolia
- [x] Contract deployed to Polygon Amoy
- [x] Contract deployed to Gnosis Chiado
- [x] Verified on all testnet explorers
- [x] E2E sweep transactions executed successfully on ALL 8 chains

**E2E Test Results (Real EIP-7702 Transactions):**
| Chain | TX Hash |
|-------|---------|
| Sepolia | [`0xef4963e2...`](https://sepolia.etherscan.io/tx/0xef4963e277a3085eb5569437da27dd8728f1967dc589b93d6215795c081b404a) |
| Base Sepolia | [`0x79dbb758...`](https://sepolia.basescan.org/tx/0x79dbb7583ce44989ce7d447fec3254a8248cf33b009152d7493b353589cb51ef) |
| Arbitrum Sepolia | [`0x11a1ddc8...`](https://sepolia.arbiscan.io/tx/0x11a1ddc8277910a3860b8f356fa1ef8641aca1e0fc4ec3b0aa45a04d2f8feb37) |
| Optimism Sepolia | [`0x1ff5305f...`](https://sepolia-optimism.etherscan.io/tx/0x1ff5305f0026ab571e7fb306cd906eb5896dc039c7b5e14601ee3937d1c2cdc2) |
| Polygon Amoy | [`0x6f4c29ff...`](https://amoy.polygonscan.com/tx/0x6f4c29fffa82e9c62578f7ff3d019b2cae740ee611c5397a2cf99a2e506d241d) |
| Gnosis Chiado | [`0xa111d3e6...`](https://gnosis-chiado.blockscout.com/tx/0xa111d3e627c86eda2c6e36cb5839e14e1590adcebcab07a84dad132028b41fcf) |
| Unichain Sepolia | [`0xc8ce1ad6...`](https://sepolia.uniscan.xyz/tx/0xc8ce1ad62823bb6644e61dda45167632e8a8a89f77f2bb9cb2239a1959f0b8ab) |
| BSC Testnet | [`0x3c64ba11...`](https://testnet.bscscan.com/tx/0x3c64ba11104017758e18448c661ffe0f714f022da48d2b857ae0b207be81667b) |

**Acceptance Criteria:**
- ✅ All testnet deployments at same deterministic address (CREATE2)
- ✅ Successful E2E sweep transaction on ALL 8 testnets
- ✅ User balance goes to exactly ZERO on all chains
- ✅ ABI exported in out/ directory

**Note:** BSC requires viem for EIP-7702 transactions (see CLAUDE.md)

---

## Milestone 2: Backend/Relayer Development

### M2.1: Project Setup & Database Schema

**Deliverables:**
- [ ] Node.js/TypeScript project with Express or Fastify
- [ ] Supabase project created
- [ ] Database schema designed and migrated
- [ ] Type definitions for all database entities
- [ ] Database client configured with connection pooling

**Database Schema:**
```sql
-- Quotes (ephemeral, short TTL)
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    from_chain_id INTEGER NOT NULL,
    to_chain_id INTEGER NOT NULL,
    destination TEXT NOT NULL,
    user_balance NUMERIC NOT NULL,
    estimated_receive NUMERIC NOT NULL,
    gas_cost NUMERIC NOT NULL,
    service_fee NUMERIC NOT NULL,
    bridge_fee NUMERIC NOT NULL,
    max_relayer_compensation NUMERIC NOT NULL,
    max_fee_per_gas NUMERIC NOT NULL,
    max_priority_fee_per_gas NUMERIC NOT NULL,
    gas_limit INTEGER NOT NULL,
    deadline TIMESTAMP NOT NULL,
    nonce INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Sweeps (permanent record)
CREATE TABLE sweeps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id),
    user_address TEXT NOT NULL,
    destination TEXT NOT NULL,
    from_chain_id INTEGER NOT NULL,
    to_chain_id INTEGER NOT NULL,
    status TEXT NOT NULL, -- pending, simulating, executing, bridging, completed, failed
    amount_sent NUMERIC,
    relayer_compensation NUMERIC,
    tx_hash TEXT,
    bridge_tx_hash TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Nonces (for quick lookup)
CREATE TABLE nonces (
    user_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    current_nonce INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_address, chain_id)
);

-- Metrics (anonymized)
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INTEGER NOT NULL,
    sweep_count INTEGER DEFAULT 0,
    total_volume NUMERIC DEFAULT 0,
    total_fees NUMERIC DEFAULT 0,
    date DATE NOT NULL,
    UNIQUE(chain_id, date)
);

-- Create indexes
CREATE INDEX idx_quotes_user ON quotes(user_address);
CREATE INDEX idx_quotes_expires ON quotes(expires_at);
CREATE INDEX idx_sweeps_user ON sweeps(user_address);
CREATE INDEX idx_sweeps_status ON sweeps(status);
```

**Acceptance Criteria:**
- Schema deployed to Supabase
- TypeScript types generated from schema
- Connection pooling verified under load

---

### M2.2: Core API Endpoints

**Deliverables:**
- [ ] `GET /v1/chains` - List supported chains
- [ ] `GET /v1/balances/{address}` - Multi-chain balance query
- [ ] `GET /v1/quote` - Generate sweep quote
- [ ] `POST /v1/authorization` - Create EIP-712 typed data
- [ ] `POST /v1/sweep` - Submit signed authorization
- [ ] `GET /v1/sweep/{id}` - Get sweep status
- [ ] OpenAPI/Swagger documentation

**Endpoint Specifications:**

```typescript
// GET /v1/chains
interface ChainsResponse {
  chains: {
    chainId: number;
    name: string;
    nativeToken: string;
    nativeTokenDecimals: number;
    minBalance: string;
    contractAddress: string;
    explorerUrl: string;
    rpcUrl: string; // Public RPC for clients
    enabled: boolean;
  }[];
}

// GET /v1/balances/{address}
interface BalancesResponse {
  address: string;
  chains: {
    chainId: number;
    name: string;
    balance: string;
    balanceFormatted: string;
    balanceUsd: number;
    canSweep: boolean;
    minBalance: string;
  }[];
  totalValueUsd: number;
}

// GET /v1/quote
interface QuoteRequest {
  fromChainId: number;
  toChainId: number;
  userAddress: string;
  destination: string;
}

interface QuoteResponse {
  quoteId: string;
  userBalance: string;
  estimatedReceive: string;
  breakdown: {
    gasCost: string;
    serviceFee: string;
    bridgeFee: string;
    totalFee: string;
  };
  gasParams: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedGasLimit: number;
  };
  deadline: number;
  nonce: number;
  validForSeconds: number;
}

// POST /v1/authorization
interface AuthorizationRequest {
  quoteId: string;
}

interface AuthorizationResponse {
  authorization: {
    user: string;
    destination: string;
    maxRelayerCompensation: string;
    deadline: number;
    nonce: number;
    sweepAll: boolean;
  };
  typedData: EIP712TypedData;
}

// POST /v1/sweep
interface SweepRequest {
  authorization: Authorization;
  signature: string;
}

interface SweepResponse {
  sweepId: string;
  status: 'pending';
}

// GET /v1/sweep/{id}
interface SweepStatusResponse {
  sweepId: string;
  status: 'pending' | 'simulating' | 'executing' | 'bridging' | 'completed' | 'failed';
  txHash?: string;
  bridgeTxHash?: string;
  amountSent?: string;
  destination: string;
  fromChainId: number;
  toChainId: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Acceptance Criteria:**
- All endpoints return correct response shapes
- Input validation on all endpoints
- Error responses follow consistent format
- Swagger UI accessible at /docs

---

### M2.3: Quote Engine

**Deliverables:**
- [ ] Gas price fetching (per chain)
- [ ] Gas estimation for sweep transactions
- [ ] Dynamic minimum balance calculation
- [ ] Service fee calculation (5% with $0.10 min, $2.00 cap)
- [ ] Bungee quote integration (for bridge fee)
- [ ] Quote caching (60 seconds)
- [ ] Pessimistic gas estimation (simulation + buffer)

**Quote Flow:**
```
User requests quote
    │
    ├── Fetch user balance (RPC)
    │
    ├── Check balance >= minimum
    │   └── If not: Return error
    │
    ├── Fetch current gas price (RPC)
    │
    ├── Estimate gas (simulation)
    │
    ├── Calculate gas cost = gasPrice * gasLimit * 1.2 (buffer)
    │
    ├── If cross-chain:
    │   └── Fetch Bungee quote for bridge fee
    │
    ├── Calculate service fee
    │   └── max($0.10, min($2.00, 5% of value))
    │
    ├── Calculate estimated receive
    │   └── balance - gasCost - serviceFee - bridgeFee
    │
    ├── Get next nonce for user
    │
    ├── Set deadline = now + 60 seconds
    │
    └── Store quote in database
        └── Return quote response
```

**Acceptance Criteria:**
- Quotes are accurate within 10% of actual execution cost
- Minimum balance correctly calculated per chain
- Service fee correctly applies min/max bounds
- Bungee integration returns valid bridge quotes

---

### M2.4: Relayer Service

**Deliverables:**
- [ ] Queue-based architecture for sweep processing
- [ ] Signature verification (EIP-712)
- [ ] Preflight validation (all checks)
- [ ] Transaction simulation
- [ ] Transaction submission with retry logic
- [ ] Transaction monitoring and status updates
- [ ] Nonce management (prevent gaps)
- [ ] Gas price monitoring

**Relayer Flow:**
```
Sweep submitted
    │
    ├── Add to processing queue
    │
    ▼
Queue processor picks up
    │
    ├── Update status: 'simulating'
    │
    ├── Run preflight checks:
    │   ├── Verify signature
    │   ├── Check deadline
    │   ├── Check nonce not used
    │   ├── Check balance >= minimum
    │   ├── Check compensation covers gas
    │   └── Check gas price in bounds
    │
    ├── Any check fails?
    │   └── Update status: 'failed', set error message
    │
    ├── Simulate transaction
    │   └── Simulation fails?
    │       └── Update status: 'failed', set error message
    │
    ├── Update status: 'executing'
    │
    ├── Submit transaction
    │   ├── Sign with KMS
    │   └── Submit to network
    │
    ├── Wait for confirmation
    │   ├── Success?
    │   │   └── If cross-chain: Update status: 'bridging'
    │   │       Else: Update status: 'completed'
    │   └── Reverted?
    │       └── Update status: 'failed', set error message
    │
    └── If bridging:
        ├── Monitor Bungee transaction
        └── When complete: Update status: 'completed'
```

**Acceptance Criteria:**
- All preflight checks enforced
- Transactions correctly signed and submitted
- Status updates in real-time
- Failed transactions don't lose user funds
- Nonce management prevents stuck transactions

---

### M2.5: Safety Policy Implementation

**Deliverables:**
- [ ] Circuit breaker system
- [ ] Per-chain success rate tracking
- [ ] Alert thresholds configuration
- [ ] Automatic chain pausing
- [ ] Manual pause/unpause endpoint (admin)
- [ ] Rate limiting by address and IP
- [ ] Suspicious activity detection

**Circuit Breaker Logic:**
```typescript
interface ChainHealth {
  chainId: number;
  successRate1h: number;     // Last hour
  successRate24h: number;    // Last 24 hours
  avgGasCostRatio: number;   // Actual vs quoted
  failedSimulations1h: number;
  isPaused: boolean;
  pauseReason?: string;
}

// Auto-pause conditions
if (successRate1h < 0.90) pause('Success rate critical');
if (avgGasCostRatio > 3.0) pause('Gas cost exceeded');
if (failedSimulations1h > 100) pause('High simulation failures');
```

**Acceptance Criteria:**
- Circuit breakers trigger correctly
- Paused chains reject new sweeps
- Alerts sent to operations
- Manual override available

---

### M2.6: WebSocket Server

**Deliverables:**
- [ ] WebSocket endpoint for sweep status updates
- [ ] Subscription management (by sweepId)
- [ ] Heartbeat/keepalive
- [ ] Reconnection handling
- [ ] Connection limits

**WebSocket Protocol:**
```typescript
// Client subscribes
{ type: 'subscribe', sweepId: 'sweep_abc123' }

// Server acknowledges
{ type: 'subscribed', sweepId: 'sweep_abc123' }

// Server sends updates
{
  type: 'status_update',
  sweepId: 'sweep_abc123',
  status: 'executing',
  txHash: '0x...',
  updatedAt: '2026-01-06T...'
}

// Client unsubscribes
{ type: 'unsubscribe', sweepId: 'sweep_abc123' }
```

**Acceptance Criteria:**
- Status updates delivered within 1 second
- Handles 1000+ concurrent connections
- Graceful handling of disconnects

---

### M2.7: Bungee Integration

**Deliverables:**
- [ ] Bungee API client
- [ ] Route discovery for supported chains
- [ ] Quote fetching
- [ ] Transaction building for bridge calls
- [ ] Bridge status monitoring
- [ ] Error handling for failed bridges

**Bungee Flow:**
```
Cross-chain sweep requested
    │
    ├── Call Bungee /quote
    │   └── Get bridge fee and route
    │
    ├── Include bridge fee in total
    │
    ├── Build sweep + bridge transaction
    │   └── Contract sends to Bungee contract
    │
    ├── Monitor Bungee transaction
    │   └── Poll status until complete
    │
    └── Update sweep status when bridge completes
```

**Acceptance Criteria:**
- Bungee quotes retrieved successfully
- Bridge transactions execute correctly
- Status monitoring catches failures
- Bridge fees accurately reflected in quotes

---

### M2.8: Monitoring & Logging

**Deliverables:**
- [ ] Structured logging (JSON format)
- [ ] Log levels (debug, info, warn, error)
- [ ] Request/response logging (anonymized)
- [ ] Metrics collection (Prometheus format or equivalent)
- [ ] Health check endpoint
- [ ] Readiness check endpoint

**Metrics to Collect:**
```
# Business metrics
zerodust_sweeps_total{chain, status}
zerodust_sweep_volume_total{chain}
zerodust_fees_total{chain}
zerodust_unique_users{chain, period}

# Operational metrics
zerodust_api_requests_total{endpoint, status}
zerodust_api_latency_seconds{endpoint}
zerodust_relayer_queue_depth
zerodust_simulation_duration_seconds
zerodust_transaction_confirmation_seconds{chain}

# Health metrics
zerodust_treasury_balance{chain}
zerodust_rpc_latency_seconds{chain}
zerodust_chain_status{chain} # 1 = active, 0 = paused
```

**Acceptance Criteria:**
- All sweep operations logged
- Metrics endpoint returns valid format
- No PII in logs
- Log retention configured

---

## Milestone 3: SDK Development

### M3.1: Core SDK (@zerodust/sdk)

**Deliverables:**
- [ ] TypeScript SDK package
- [ ] API client with full type safety
- [ ] Error handling with typed errors
- [ ] Retry logic with exponential backoff
- [ ] Request/response logging (optional)
- [ ] Environment configuration (testnet/mainnet)

**SDK Interface:**
```typescript
import { ZeroDust } from '@zerodust/sdk';

const zerodust = new ZeroDust({
  environment: 'mainnet', // or 'testnet'
  apiKey: 'optional-partner-key',
});

// Get supported chains
const chains = await zerodust.getChains();

// Get balances
const balances = await zerodust.getBalances(userAddress);

// Get quote
const quote = await zerodust.getQuote({
  fromChainId: 42161,
  toChainId: 8453,
  userAddress: '0x...',
  destination: '0x...',
});

// Create authorization for signing
const { authorization, typedData } = await zerodust.createAuthorization(quote.quoteId);

// Submit sweep
const sweep = await zerodust.submitSweep({
  authorization,
  signature,
});

// Get sweep status
const status = await zerodust.getSweepStatus(sweep.sweepId);

// Subscribe to status updates
zerodust.onSweepStatus(sweep.sweepId, (status) => {
  console.log(status);
});
```

**Acceptance Criteria:**
- Full TypeScript types
- Works in Node.js and browser
- Bundle size < 50KB gzipped
- Zero runtime dependencies (except fetch polyfill)

---

### M3.2: React Components (@zerodust/react)

**Deliverables:**
- [ ] `ZeroDustProvider` - Context provider
- [ ] `useZeroDust` - Core hook
- [ ] `useBalances` - Balance fetching hook
- [ ] `useQuote` - Quote fetching hook
- [ ] `useSweep` - Sweep execution hook
- [ ] `BalanceList` - Display component
- [ ] `SweepButton` - Action component
- [ ] `SweepStatus` - Status display component
- [ ] CSS variable theming system

**Component API:**
```tsx
import {
  ZeroDustProvider,
  BalanceList,
  SweepButton,
  SweepStatus,
  useZeroDust,
  useBalances,
  useQuote,
  useSweep,
} from '@zerodust/react';

// Provider wraps app
<ZeroDustProvider
  environment="mainnet"
  apiKey="optional"
>
  <App />
</ZeroDustProvider>

// Pre-built components
<BalanceList address={userAddress} />
<SweepButton
  fromChainId={42161}
  toChainId={8453}
  onSuccess={(sweep) => {}}
  onError={(error) => {}}
/>
<SweepStatus sweepId={sweepId} />

// Hooks for custom UI
const { chains, isLoading } = useZeroDust();
const { balances, refetch } = useBalances(address);
const { quote, isLoading, error } = useQuote(params);
const { execute, status, txHash } = useSweep();
```

**Theming System:**
```css
:root {
  --zerodust-primary: #6366f1;
  --zerodust-primary-hover: #4f46e5;
  --zerodust-bg: #0a0a0a;
  --zerodust-bg-secondary: #171717;
  --zerodust-text: #fafafa;
  --zerodust-text-secondary: #a1a1aa;
  --zerodust-border: #27272a;
  --zerodust-success: #22c55e;
  --zerodust-error: #ef4444;
  --zerodust-warning: #f59e0b;
  --zerodust-radius: 12px;
  --zerodust-font: 'Inter', sans-serif;
}
```

**Acceptance Criteria:**
- Components render correctly
- Hooks manage state properly
- Theming via CSS variables works
- SSR compatible (Next.js)
- Accessible (ARIA labels)

---

### M3.3: SDK Documentation

**Deliverables:**
- [ ] README with quickstart
- [ ] API reference (generated from TypeScript)
- [ ] Integration examples
- [ ] Troubleshooting guide
- [ ] Migration guide (for future versions)

**Documentation Structure:**
```
docs/
├── getting-started.md
├── api-reference/
│   ├── sdk.md
│   └── react.md
├── examples/
│   ├── basic-usage.md
│   ├── custom-ui.md
│   └── wallet-integration.md
├── troubleshooting.md
└── changelog.md
```

**Acceptance Criteria:**
- All public APIs documented
- Working code examples
- Copy-paste ready snippets

---

### M3.4: SDK Publishing

**Deliverables:**
- [ ] NPM package configuration
- [ ] Semantic versioning setup
- [ ] Changelog generation
- [ ] GitHub release automation
- [ ] NPM publishing workflow

**Package Configuration:**
```json
{
  "name": "@zerodust/sdk",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "sideEffects": false
}
```

**Acceptance Criteria:**
- Package published to NPM
- Types available via @types or bundled
- Tree-shaking works
- ESM and CJS both work

---

## Milestone 4: Frontend Development

### M4.1: Project Setup

**Deliverables:**
- [ ] Next.js 14+ project with App Router
- [ ] Tailwind CSS configured
- [ ] RainbowKit + wagmi + viem setup
- [ ] Environment configuration
- [ ] Layout and navigation structure
- [ ] Dark mode (default)

**Project Structure:**
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── sweep/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── wallet/
│   │   └── sweep/
│   ├── hooks/
│   ├── lib/
│   │   ├── wagmi.ts
│   │   └── zerodust.ts
│   └── styles/
├── public/
└── next.config.js
```

**Acceptance Criteria:**
- Development server runs
- Wallet connection works
- Dark mode displays correctly
- Mobile responsive base layout

---

### M4.2: Wallet Connection

**Deliverables:**
- [ ] RainbowKit connect button
- [ ] Network switching support
- [ ] Wrong network detection
- [ ] Auto-switch prompt for unsupported chains
- [ ] Connection state persistence
- [ ] Disconnect handling

**Acceptance Criteria:**
- Major wallets connect (MetaMask, Rainbow, Coinbase, WalletConnect)
- Network switching prompts work
- Connection persists across page refreshes
- Clear feedback for unsupported networks

---

### M4.3: Sweep Flow UI

**Deliverables:**
- [ ] Chain selector (From)
- [ ] Chain selector (To)
- [ ] Balance display (auto-populated)
- [ ] Destination address input
- [ ] Fee breakdown display
- [ ] Quote refresh countdown
- [ ] Sweep confirmation modal
- [ ] Signature request handling

**UI Flow:**
```
┌─────────────────────────────────────────┐
│              ZeroDust                    │
├─────────────────────────────────────────┤
│                                         │
│  From                                   │
│  ┌─────────────────────────────────┐   │
│  │ [Arbitrum ▼]         0.0008 ETH │   │
│  │                         ~$2.40  │   │
│  └─────────────────────────────────┘   │
│                                         │
│                  ↓                       │
│                                         │
│  To                                     │
│  ┌─────────────────────────────────┐   │
│  │ [Base ▼]                        │   │
│  │ 0x1234...5678           [Edit]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ You receive          0.00072 ETH│   │
│  │                         ~$2.16  │   │
│  ├─────────────────────────────────┤   │
│  │ Network fee            $0.05    │   │
│  │ Service fee            $0.12    │   │
│  │ Bridge fee             $0.07    │   │
│  │ ─────────────────────────────── │   │
│  │ Total fee              $0.24    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Quote expires in 0:47                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │           Sweep Now              │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Acceptance Criteria:**
- Chain selectors show correct chains
- Balance auto-fills from connected wallet
- Destination pre-fills for cross-chain
- Destination empty for same-chain
- Fee breakdown shows all components
- Quote countdown updates in real-time
- Sweep button triggers signature request

---

### M4.4: Transaction Status

**Deliverables:**
- [ ] Status page (/sweep/[id])
- [ ] Real-time status updates (WebSocket)
- [ ] Progress indicator
- [ ] Transaction links (explorer)
- [ ] Error display
- [ ] Success celebration

**Status States:**
```
pending    → "Preparing your sweep..."
simulating → "Simulating transaction..."
executing  → "Executing on [Chain]..." + tx link
bridging   → "Bridging to [Chain]..." + bridge tx link
completed  → "Success! Funds sent to [destination]"
failed     → "Failed: [error message]" + retry option
```

**Acceptance Criteria:**
- Status updates in real-time
- Transaction hashes link to explorers
- Clear error messages (user-friendly)
- Share/copy transaction link

---

### M4.5: Testnet Toggle

**Deliverables:**
- [ ] Testnet/Mainnet toggle in UI
- [ ] Visual indicator of current mode
- [ ] Separate testnet configuration
- [ ] Warning banner when on testnet

**Acceptance Criteria:**
- Toggle switches all API calls to testnet
- Visual distinction between modes
- Testnet chains displayed when toggled

---

### M4.6: Mobile Responsiveness

**Deliverables:**
- [ ] Responsive layout for all screen sizes
- [ ] Touch-friendly controls
- [ ] Mobile wallet connection (WalletConnect)
- [ ] Swipe gestures (if applicable)

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Acceptance Criteria:**
- All features work on mobile
- No horizontal scrolling
- Touch targets >= 44px
- Wallet connection works on mobile browsers

---

### M4.7: Error Handling & Edge Cases

**Deliverables:**
- [ ] Wallet not connected state
- [ ] No balance state
- [ ] Balance below minimum state
- [ ] Network error handling
- [ ] Quote expiry handling
- [ ] Signature rejection handling
- [ ] Transaction failure handling

**Error States:**
```
No wallet      → "Connect wallet to continue"
No balance     → "No sweepable balance found"
Below minimum  → "Balance too low to sweep (minimum: X)"
Network error  → "Network error. Please try again."
Quote expired  → "Quote expired. Getting new quote..."
Sig rejected   → "Signature cancelled"
Tx failed      → "Transaction failed: [user-friendly message]"
```

**Acceptance Criteria:**
- All error states have clear UI
- User can recover from all errors
- No stuck states

---

## Milestone 5: Testing & Quality Assurance

### M5.1: End-to-End Tests

**Deliverables:**
- [ ] E2E test suite (Playwright or Cypress)
- [ ] Wallet connection tests (with mock)
- [ ] Full sweep flow tests
- [ ] Error scenario tests
- [ ] Mobile viewport tests

**E2E Test Scenarios:**
```
- Connect wallet
- View balances across chains
- Create quote for same-chain sweep
- Create quote for cross-chain sweep
- Execute sweep (signature + confirmation)
- Track sweep status
- Handle expired quote
- Handle network errors
- Disconnect wallet
```

**Acceptance Criteria:**
- All critical paths covered
- Tests run in CI
- < 5 minutes total runtime

---

### M5.2: Integration Tests

**Deliverables:**
- [ ] API integration tests
- [ ] Contract integration tests (forked mainnet)
- [ ] Bungee integration tests
- [ ] WebSocket tests
- [ ] Rate limiting tests

**Acceptance Criteria:**
- All integrations tested
- Forked mainnet tests for contract
- Tests run in CI

---

### M5.3: Security Review

**Deliverables:**
- [ ] Security checklist completion
- [ ] Dependency audit
- [ ] Secret scanning
- [ ] Input validation review
- [ ] Rate limiting verification
- [ ] Authentication review

**Security Checklist:**
```
Contract:
[ ] No reentrancy vulnerabilities
[ ] Integer overflow protection
[ ] Access control correct
[ ] Events emitted for all state changes
[ ] No front-running vulnerabilities

Backend:
[ ] Input validation on all endpoints
[ ] SQL injection protection
[ ] Rate limiting enforced
[ ] Secrets not in code
[ ] CORS configured correctly
[ ] HTTPS only

Frontend:
[ ] No XSS vulnerabilities
[ ] CSP headers configured
[ ] Sensitive data not in localStorage
[ ] API keys not exposed
```

**Acceptance Criteria:**
- All checklist items verified
- No critical/high vulnerabilities
- Dependency audit clean

---

### M5.4: Performance Testing

**Deliverables:**
- [ ] API load testing
- [ ] WebSocket connection limits
- [ ] Database query optimization
- [ ] Frontend bundle analysis
- [ ] Lighthouse audit

**Performance Targets:**
```
API:
- p95 latency < 200ms
- Handle 100 req/s sustained

WebSocket:
- Support 1000 concurrent connections

Frontend:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle size < 200KB gzipped
```

**Acceptance Criteria:**
- All performance targets met
- No memory leaks
- Database queries optimized

---

### M5.5: Testnet Beta

**Deliverables:**
- [ ] Beta deployment to testnet
- [ ] Beta user recruitment (10-20 users)
- [ ] Feedback collection system
- [ ] Bug tracking
- [ ] Iteration on feedback

**Beta Program:**
```
Week 1: Internal testing
Week 2: Closed beta (5-10 users)
Week 3: Open beta (20+ users)
Week 4: Bug fixes and polish
```

**Acceptance Criteria:**
- Real users complete sweeps
- Critical bugs fixed
- UX feedback incorporated

---

## Milestone 6: Audit & Launch

### M6.1: Audit Preparation

**Deliverables:**
- [ ] Audit documentation package
- [ ] Threat model document
- [ ] Test coverage report
- [ ] Deployment documentation
- [ ] Code freeze

**Audit Package Contents:**
```
audit-package/
├── README.md (project overview)
├── SCOPE.md (what to audit)
├── contracts/ (all Solidity code)
├── tests/ (all test files)
├── ARCHITECTURE.md (system design)
├── THREAT_MODEL.md (known risks)
├── coverage/ (test coverage report)
└── deployments/ (deployed addresses)
```

**Acceptance Criteria:**
- All documentation complete
- Code frozen for audit
- Auditor can understand system from docs alone

---

### M6.2: Audit Execution

**Deliverables:**
- [ ] Audit grant approved (Optimism or Arbitrum)
- [ ] Auditor engaged
- [ ] Audit kickoff call
- [ ] Audit findings addressed
- [ ] Final audit report

**Acceptance Criteria:**
- No critical findings
- No high findings (or all addressed)
- Audit report published

---

### M6.3: Mainnet Deployment

**Deliverables:**
- [ ] Mainnet contract deployments
- [ ] Contract verification
- [ ] Production backend deployment
- [ ] Production frontend deployment
- [ ] DNS configuration
- [ ] SSL certificates
- [ ] Monitoring setup

**Deployment Checklist:**
```
Pre-deployment:
[ ] All tests passing
[ ] Audit complete
[ ] Treasury funded
[ ] KMS configured
[ ] Monitoring alerts configured

Contracts:
[ ] Deploy to Ethereum mainnet
[ ] Deploy to Arbitrum
[ ] Deploy to Optimism
[ ] Deploy to Base
[ ] Verify all contracts

Infrastructure:
[ ] Backend deployed to Railway
[ ] Frontend deployed to Vercel
[ ] Database migrated
[ ] WebSocket server running
[ ] Health checks passing

Post-deployment:
[ ] Smoke test on each chain
[ ] Execute test sweeps
[ ] Verify monitoring
[ ] Document deployed addresses
```

**Acceptance Criteria:**
- All chains deployed
- All services healthy
- Test sweeps successful

---

### M6.4: Launch

**Deliverables:**
- [ ] Launch announcement
- [ ] Documentation public
- [ ] Support channels ready
- [ ] Monitoring active
- [ ] Incident response plan ready

**Launch Checklist:**
```
[ ] Website live at zerodust.xyz
[ ] API docs at docs.zerodust.xyz
[ ] SDK published to NPM
[ ] Twitter announcement
[ ] Discord/support ready
[ ] Runbook documented
[ ] On-call rotation set
```

**Acceptance Criteria:**
- Public can access and use ZeroDust
- Support can respond to issues
- Monitoring catches problems

---

## Milestone Dependencies Graph

```
M0 (Setup)
    │
    ▼
M1 (Contract) ─────────────────────────────────┐
    │                                          │
    ▼                                          │
M2 (Backend) ──────────────────┐               │
    │                          │               │
    ▼                          │               │
M3 (SDK)                       │               │
    │                          │               │
    ▼                          ▼               ▼
M4 (Frontend) ─────────────► M5 (Testing) ─► M6 (Audit/Launch)
```

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| EIP-7702 edge cases | High | Medium | Extensive testing, audit |
| Bungee API changes | Medium | Low | Abstraction layer, fallback |
| Audit delays | High | Medium | Apply to multiple programs |
| Treasury depletion | High | Low | Monitoring, alerts |
| Low testnet coverage | Medium | Medium | Test on multiple testnets |

---

## Success Criteria Summary

| Milestone | Key Success Criteria |
|-----------|---------------------|
| M0 | Clean repo, all tools working |
| M1 | Contract deployed to testnet, tests passing |
| M2 | API functional, sweeps execute on testnet |
| M3 | SDK published, documentation complete |
| M4 | Website live on testnet, full flow works |
| M5 | All tests passing, beta feedback positive |
| M6 | Audit passed, mainnet live, sweeps working |

---

*Document Version: 1.0*
*Created: January 2026*
