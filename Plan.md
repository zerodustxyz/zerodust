# ZeroDust Build Plan

## Executive Summary

ZeroDust enables users to drain their native gas token balance to exactly zero on EIP-7702 supported chains via a single signature and sponsored execution. This document outlines the complete build plan derived from the v3 specification and detailed stakeholder interview.

**Core Value Proposition:** Exit any supported chain completely without leaving gas behind for the exit transaction.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ZERODUST SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌──────────────────┐         ┌──────────────────┐                    │
│    │   ZERODUST.XYZ   │         │   PARTNER SDK    │                    │
│    │    (Next.js)     │         │   (TypeScript)   │                    │
│    └────────┬─────────┘         └────────┬─────────┘                    │
│             │                            │                               │
│             └────────────┬───────────────┘                               │
│                          │                                               │
│                          ▼                                               │
│              ┌───────────────────────┐                                   │
│              │     ZERODUST API      │                                   │
│              │    (Node.js/TS)       │                                   │
│              │                       │                                   │
│              │  ┌─────────────────┐  │                                   │
│              │  │    Relayer      │  │                                   │
│              │  │    Service      │  │                                   │
│              │  └─────────────────┘  │                                   │
│              │                       │                                   │
│              │  ┌─────────────────┐  │                                   │
│              │  │   Quote Engine  │  │                                   │
│              │  └─────────────────┘  │                                   │
│              │                       │                                   │
│              │  ┌─────────────────┐  │                                   │
│              │  │  Safety Policy  │  │                                   │
│              │  │   Enforcement   │  │                                   │
│              │  └─────────────────┘  │                                   │
│              └───────────┬───────────┘                                   │
│                          │                                               │
│         ┌────────────────┼────────────────┐                              │
│         │                │                │                              │
│         ▼                ▼                ▼                              │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────┐                       │
│  │  SPONSOR   │  │   DRAIN     │  │   BUNGEE    │                       │
│  │  WALLET    │  │  CONTRACT   │  │     API     │                       │
│  │  (KMS)     │  │ (per chain) │  │  (bridging) │                       │
│  └────────────┘  └─────────────┘  └─────────────┘                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      SUPABASE                                    │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │    │
│  │  │  Drains   │  │  Quotes   │  │  Metrics  │  │   Logs    │    │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Decisions Summary

### 2.1 Core Product Scope

| Decision | Rationale |
|----------|-----------|
| Native gas token only | Reduces attack surface, ERC-20s are well-served by DEXs |
| Single destination per drain | Simplifies contract logic and user mental model |
| No scheduling/delayed execution | Eliminates fund custody concerns entirely |
| 1-minute quote validity | Minimizes gas price drift risk |
| Abstracted bridge (Bungee) | Better UX than manual two-step process |

### 2.2 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Smart Contracts | Solidity 0.8.24+ / Foundry | Industry standard, excellent fuzzing |
| Backend/Relayer | Node.js / TypeScript | Same language as SDK, excellent viem support |
| Frontend | Next.js 14+ (App Router) | Industry standard, Vercel deployment |
| Database | Supabase (PostgreSQL) | Managed, realtime subscriptions, auth |
| Wallet Connection | RainbowKit + wagmi + viem | Most polished, widest adoption |
| Hosting | Vercel (frontend) + Railway (backend) | Simple, scalable, cost-effective |
| Bridge Integration | Bungee (Socket) | No API fees, reliable |

### 2.3 Security Architecture

| Component | Approach |
|-----------|----------|
| Contract | Immutable, no proxy, no pause function, no admin |
| Relayer Hot Wallet | AWS KMS or GCP Cloud KMS |
| Treasury | Safe multisig for accumulated fees |
| Nonces | Sequential per-user per-chain |
| Deadlines | 1-minute maximum, server-generated |
| Simulation | Mandatory preflight before every execution |

---

## 3. Development Phases

### Phase 1: Smart Contract Development
**Duration:** 2-3 weeks

**Deliverables:**
- ZeroDustDrain contract (native-only, sweep-all)
- Comprehensive test suite (unit + fuzz)
- Gas optimization
- Deployment scripts (CREATE2 deterministic)
- Testnet deployment

**Critical Path:** Contract must be complete before backend can execute drains.

### Phase 2: Backend/Relayer Development
**Duration:** 3-4 weeks

**Deliverables:**
- REST API (balances, quotes, authorization, drain, status)
- WebSocket server (real-time drain status)
- Relayer service with full safety policy
- Quote engine with dynamic pricing
- Bungee integration
- Supabase schema and migrations
- Monitoring and alerting foundation

**Dependencies:** Phase 1 contract ABI and testnet deployment.

### Phase 3: SDK Development
**Duration:** 2 weeks

**Deliverables:**
- TypeScript SDK (@zerodust/sdk)
- React components (@zerodust/react)
- CSS variable theming system
- Comprehensive documentation
- NPM package publishing pipeline

**Dependencies:** Phase 2 API must be stable.

### Phase 4: Frontend Development
**Duration:** 2 weeks

**Deliverables:**
- zerodust.xyz website
- Wallet connection flow
- Drain flow UI (From/To chain selection)
- Transaction status tracking
- Testnet toggle
- Mobile responsive design

**Dependencies:** Phase 3 SDK components.

### Phase 5: Testing & Audit Preparation
**Duration:** 2-3 weeks

**Deliverables:**
- End-to-end integration tests
- Testnet beta with selected users
- Security review checklist
- Audit documentation package
- Bug fixes from testing

**Dependencies:** All previous phases complete.

### Phase 6: Audit & Mainnet Launch
**Duration:** 4-6 weeks (audit) + 1-2 weeks (launch prep)

**Deliverables:**
- Audit completion (via Optimism/Arbitrum grants)
- Mainnet contract deployment
- Production infrastructure
- Launch checklist verification
- Public launch

**Dependencies:** Audit grant approval, audit completion.

---

## 4. Contract Design

### 4.1 Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IZeroDustDrain {
    struct DrainAuthorization {
        address user;                    // User authorizing the drain
        address destination;             // Where to send funds
        uint256 maxRelayerCompensation;  // Maximum gas + fee cap
        uint256 deadline;                // Authorization expiry timestamp
        uint256 nonce;                   // One-time use nonce
        bool sweepAll;                   // Always true for ZeroDust
    }

    function executeDrain(
        DrainAuthorization calldata auth,
        bytes calldata signature
    ) external;

    function isNonceUsed(address user, uint256 nonce) external view returns (bool);
    function getCurrentNonce(address user) external view returns (uint256);

    event DrainExecuted(
        address indexed user,
        address indexed destination,
        uint256 amountSent,
        uint256 relayerCompensation,
        uint256 nonce
    );
}
```

### 4.2 Security Properties

1. **No admin functions** - Contract is fully autonomous
2. **No pause mechanism** - Maximally trustless
3. **No upgradeability** - Immutable code
4. **Nonce replay protection** - Each authorization is one-time use
5. **Deadline enforcement** - Authorizations expire
6. **Compensation cap** - User controls maximum fee via signature
7. **Checks-effects-interactions** - Reentrancy protection pattern

### 4.3 Deployment Strategy

- **CREATE2 Factory** - Deterministic addresses across all chains
- **Verification** - Etherscan/Blockscout verification on all chains
- **Same bytecode** - Identical contract on every chain

---

## 5. API Design

### 5.1 Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v1/chains` | GET | No | List supported chains |
| `/v1/balances/{address}` | GET | No | Native balances across chains |
| `/v1/quote` | GET | No | Get drain quote with fees |
| `/v1/authorization` | POST | No | Create EIP-712 typed data for signing |
| `/v1/drain` | POST | Rate-limited | Submit signed authorization |
| `/v1/drain/{id}` | GET | No | Get drain status |
| `wss://api.zerodust.xyz/v1/status` | WS | No | Real-time drain updates |

### 5.2 Quote Response Structure

```typescript
interface QuoteResponse {
  quoteId: string;
  userBalance: string;           // Wei
  estimatedReceive: string;      // Wei (after all fees)
  breakdown: {
    gasCost: string;             // Wei
    serviceFee: string;          // Wei
    bridgeFee: string;           // Wei (0 if same-chain)
    totalFee: string;            // Wei
  };
  gasParams: {
    maxFeePerGas: string;        // Wei
    maxPriorityFeePerGas: string;// Wei
    estimatedGasLimit: number;
  };
  deadline: number;              // Unix timestamp
  nonce: number;
  validForSeconds: 60;           // 1 minute
}
```

### 5.3 Rate Limiting

| Tier | Quotes/min | Drains/hour |
|------|------------|-------------|
| Anonymous (IP) | 30 | 10 |
| Authenticated | 120 | 100 |
| Partner | Unlimited | Unlimited |

---

## 6. Relayer Safety Policy

### 6.1 Preflight Checks (Mandatory)

```
BEFORE EVERY EXECUTION:

1. ✓ Verify signature (EIP-712)
2. ✓ Check deadline not expired
3. ✓ Verify nonce not used
4. ✓ Confirm balance >= dynamic minimum
5. ✓ Validate compensation covers current gas + margin
6. ✓ Simulate transaction (must succeed)
7. ✓ Verify gas price within quoted bounds
8. ✓ For cross-chain: Validate Bungee route available

ANY CHECK FAILS → REJECT IMMEDIATELY
```

### 6.2 Rejection Scenarios

| Condition | Response |
|-----------|----------|
| Invalid signature | 400: INVALID_SIGNATURE |
| Expired deadline | 400: AUTHORIZATION_EXPIRED |
| Nonce already used | 400: NONCE_USED |
| Balance below minimum | 400: BALANCE_TOO_LOW |
| Gas price exceeded | 400: GAS_PRICE_EXCEEDED, include new quote |
| Simulation failed | 400: SIMULATION_FAILED |
| Balance changed significantly | 400: BALANCE_CHANGED, require re-quote |
| Bungee route unavailable | 400: BRIDGE_UNAVAILABLE |

### 6.3 Circuit Breakers

| Trigger | Action |
|---------|--------|
| Success rate < 95% | Alert operations |
| Success rate < 90% | Pause affected chain |
| Gas cost > 3x compensation | Pause affected chain |
| Treasury balance critical | Pause all chains |

---

## 7. Fee Structure

### 7.1 Formula

```
User Pays = Gas Cost (at-cost) + Service Fee + Bridge Fee (if cross-chain)

Service Fee = max($0.10, min($2.00, 5% of drain value))
```

### 7.2 Fee Flow

```
User Balance: $50.00
    │
    ├── Gas Cost: $0.05 ──────────────► Relayer (reimbursement)
    ├── Service Fee: $2.00 ───────────► ZeroDust Treasury
    ├── Bridge Fee: $0.20 ────────────► Bungee (pass-through)
    │
    └── User Receives: $47.75 ────────► Destination Address
```

### 7.3 Dynamic Minimum Balance

```typescript
function calculateMinimumBalance(chainId: number): bigint {
  const estimatedGas = await estimateGasCost(chainId);
  const safetyMultiplier = 2n; // 2x buffer
  const minServiceFee = parseEther('0.00003'); // ~$0.10 in ETH

  return (estimatedGas * safetyMultiplier) + minServiceFee;
}
```

---

## 8. Supported Chains

### 8.1 Launch Chains (All EIP-7702 Compatible)

All chains with EIP-7702 support will be available at launch:

| Chain | Chain ID | Native Token | EIP-7702 | Bungee | Notes |
|-------|----------|--------------|----------|--------|-------|
| Ethereum | 1 | ETH | ✓ | ✓ | Reference implementation |
| BSC | 56 | BNB | ✓ | ✓ | High volume |
| Base | 8453 | ETH | ✓ | ✓ | High volume |
| Optimism | 10 | ETH | ✓ | ✓ | Audit grant available |
| Arbitrum | 42161 | ETH | ✓ | ✓ | Audit grant available |
| Unichain | 130 | ETH | ✓ | TBD | New chain |
| Polygon | 137 | POL | ✓ | ✓ | High user count |
| Gnosis | 100 | xDAI | ✓ | ✓ | Established chain |

### 8.2 Chain Requirements

Each chain requires:
1. **EIP-7702 active** - Sponsored execution support
2. **Bungee support** - For cross-chain drains (same-chain works regardless)
3. **Reliable RPC** - Multiple provider options
4. **Block explorer** - For contract verification
5. **Treasury funding** - Initial gas float

---

## 9. Infrastructure

### 9.1 Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  zerodust.xyz (Next.js)                                  │    │
│  │  - SSR/Edge functions                                    │    │
│  │  - CDN distribution                                      │    │
│  │  - Preview deployments                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RAILWAY                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │  API Service        │  │  Relayer Service    │              │
│  │  (Node.js)          │  │  (Node.js)          │              │
│  │  - REST endpoints   │  │  - Queue consumer   │              │
│  │  - WebSocket        │  │  - Transaction      │              │
│  │  - Rate limiting    │  │    submission       │              │
│  └─────────────────────┘  └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │  PostgreSQL         │  │  Realtime           │              │
│  │  - drains           │  │  - Status updates   │              │
│  │  - quotes           │  │                     │              │
│  │  - metrics          │  │                     │              │
│  └─────────────────────┘  └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  AWS KMS   │  │  Alchemy/  │  │  Bungee    │                │
│  │  (signing) │  │  Infura    │  │  API       │                │
│  │            │  │  (RPC)     │  │            │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 RPC Strategy

| Usage | Provider | Rationale |
|-------|----------|-----------|
| Balance queries | Public RPCs + Alchemy | Cost-effective for reads |
| Transaction submission | Alchemy/Infura paid | Reliability critical |
| Simulation | Tenderly or Alchemy | Accurate gas estimation |

---

## 10. Monitoring & Observability

### 10.1 Key Metrics

| Category | Metrics |
|----------|---------|
| Business | Drains/day, Revenue, Unique users, Chain distribution |
| Operational | Success rate, Latency (p50/p95/p99), Queue depth |
| Financial | Treasury balance per chain, Gas cost vs compensation |
| Security | Failed simulations, Rejected authorizations, Anomalies |

### 10.2 Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Success rate | < 98% | < 95% |
| Drain latency (same-chain) | > 15s | > 30s |
| Treasury balance | < $500 | < $200 |
| Failed simulations (1h) | > 5% | > 10% |

---

## 11. Risk Mitigation

### 11.1 Technical Risks

| Risk | Probability | Mitigation |
|------|-------------|------------|
| EIP-7702 bugs | Low | Comprehensive testing, audit |
| Bridge failure | Medium | Pre-validate Bungee state, two-phase UX |
| Gas price volatility | Medium | 1-minute quotes, pessimistic estimation |
| Relayer griefing | Low | Full safety policy, simulation |

### 11.2 Business Risks

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Low adoption | Medium | B2B SDK focus, wallet partnerships |
| Wallets build native | Medium | Move fast, make integration trivial |
| Regulatory concerns | Low | No custody, transparent operation |

### 11.3 Security Risks

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Contract vulnerability | Low | Audit, minimal surface area |
| Key compromise | Low | KMS/MPC, minimal hot wallet balance |
| API abuse | Medium | Rate limiting, progressive throttling |

---

## 12. Success Criteria

### 12.1 Technical KPIs

| Metric | Target |
|--------|--------|
| Drain success rate | > 99% |
| Same-chain drain latency | < 30 seconds |
| Cross-chain drain latency | < 5 minutes |
| Uptime | > 99.9% |

### 12.2 Business KPIs (Year 1)

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Total drains | 1,500 | 8,000 | 35,000 |
| Unique users | 500 | 2,500 | 10,000 |
| Revenue | $1,300 | $7,100 | $31,000 |

---

## 13. Dependencies & Integrations

### 13.1 External Dependencies

| Dependency | Purpose | Fallback |
|------------|---------|----------|
| Bungee API | Cross-chain bridging | Disable cross-chain |
| Alchemy/Infura | RPC access | Multiple providers |
| Supabase | Database & realtime | Self-hosted Postgres |
| AWS KMS | Key management | GCP KMS |

### 13.2 Internal Dependencies

```
Contract ──────► Backend ──────► SDK ──────► Frontend
    │                │             │
    │                ▼             │
    │           Supabase           │
    │                              │
    └──────────────────────────────┘
         (All depend on contract ABI)
```

---

## 14. Documentation Requirements

| Document | Audience | Contents |
|----------|----------|----------|
| API Reference | Developers | Endpoint specs, examples |
| SDK Quickstart | Partners | Installation, basic usage |
| Integration Guide | Wallets | Deep integration patterns |
| Security Model | Auditors | Threat model, mitigations |
| Runbook | Operations | Incident response, procedures |

---

## 15. Open Questions for Build

1. **Testnet bridging:** Confirm Bungee testnet support (Sepolia ↔ Base Sepolia)
2. **EIP-7702 wallet support:** Verify RainbowKit's EIP-7702 signing UX
3. **Audit grant timing:** Apply immediately, timeline affects mainnet launch
4. **Domain acquisition:** Confirm zerodust.xyz availability and registration
5. **KMS setup:** Choose AWS vs GCP based on existing infrastructure

---

*Document Version: 1.0*
*Created: January 2026*
*Based on: zerodust-build-summary-v3.md + Stakeholder Interview*
