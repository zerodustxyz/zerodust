# ZeroDust

**Exit a blockchain completely - transfer 100% of your native gas balance via EIP-7702**

ZeroDust enables users to transfer their entire native gas token balance to exactly zero on supported EIP-7702 chains via a single signature and sponsored execution.

## The Problem

When users want to fully exit a blockchain, they face an impossible situation:

```
User has: 0.0008 ETH on Arbitrum
User wants: 0 ETH on Arbitrum (transfer everything to Base)

The Problem:
├── To send ETH, you need ETH for gas
├── If you send all your ETH, you can't pay gas
├── If you keep gas, you can't send all your ETH
└── Result: Small amount always stranded
```

**ZeroDust is the only solution that enables complete chain exits for native gas tokens.**

## How It Works

1. User connects wallet to ZeroDust
2. User selects source chain and destination
3. User signs ONE authorization (no gas needed)
4. ZeroDust sponsor wallet executes the transfer
5. User receives funds on destination
6. **Origin chain balance: EXACTLY ZERO**

## Supported Chains

All chains with EIP-7702 support:

| Chain | Native Token |
|-------|--------------|
| Ethereum | ETH |
| BSC | BNB |
| Base | ETH |
| Optimism | ETH |
| Arbitrum | ETH |
| Unichain | ETH |
| Polygon | POL |
| Gnosis | xDAI |

## Project Structure

```
zerodust/
├── contracts/     # Solidity smart contracts (Foundry)
├── backend/       # API & Relayer service (Node.js/TypeScript)
├── sdk/           # TypeScript SDK & React components
├── frontend/      # Web application (Next.js)
├── docs/          # Documentation
├── Plan.md        # Build plan
├── Milestones.md  # Development milestones
└── Claude.md      # AI development guidelines
```

## Documentation

- [Plan.md](./Plan.md) - Complete build plan and architecture
- [Milestones.md](./Milestones.md) - Detailed development milestones
- [Claude.md](./Claude.md) - AI development guidelines and security standards

## Security

ZeroDust is designed with security as the top priority:

- **No fund custody** - All operations are atomic, single-transaction
- **User-controlled limits** - Maximum fee is signed by user
- **Immutable contracts** - No admin functions, no upgrades
- **Mandatory simulation** - Every transaction simulated before execution
- **Audit planned** - Via Optimism/Arbitrum grant programs

## License

MIT License - see [LICENSE](./LICENSE)

## Status

**Milestone 1: Smart Contract - COMPLETE** ✅

| Milestone | Status |
|-----------|--------|
| M1: Smart Contract | ✅ Complete |
| M2: Backend/Relayer | 🔜 Next |
| M3: SDK | ⏳ Pending |
| M4: Frontend | ⏳ Pending |
| M5: Testing & QA | ⏳ Pending |
| M6: Audit & Launch | ⏳ Pending |

### Testnet Deployments

Contract deployed and E2E verified on all 8 testnets:

**Contract Address:** `0x05a94F2479eE0Fa99f1790e1cB0A8d326263f6eC` (same on all chains)

| Chain | Verified | E2E Tested |
|-------|----------|------------|
| Sepolia | ✅ | ✅ |
| Base Sepolia | ✅ | ✅ |
| Arbitrum Sepolia | ✅ | ✅ |
| Optimism Sepolia | ✅ | ✅ |
| BSC Testnet | ✅ | ✅ |
| Polygon Amoy | ✅ | ✅ |
| Gnosis Chiado | ✅ | ✅ |
| Unichain Sepolia | ✅ | ✅ |

**Not yet ready for production use.**
