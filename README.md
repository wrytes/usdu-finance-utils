# USDU Finance Utilities

A TypeScript and Solidity development toolkit for USDU Finance smart contract integrations.

## Overview

This package provides a complete development environment for building and deploying Solidity smart contracts for USDU Finance, with built-in support for Aragon DAO integrations, multi-chain deployments, and comprehensive testing infrastructure.

## Features

- **Multi-Chain Support**: Pre-configured for Ethereum, Polygon, Optimism, Arbitrum, Base, Avalanche, Gnosis, and Sonic
- **Type-Safe Deployments**: Hardhat Ignition modules with TypeScript support
- **Chain Configuration**: Built-in chain IDs and Chainlink CCIP selectors
- **Development Tools**: Wallet management, constructor argument storage, and ABI export
- **Testing Infrastructure**: Hardhat test suite with coverage reporting
- **NPM Package Ready**: Configured with tsup for library distribution

## Project Structure

```
usdu-finance-utils/
├── contracts/              # Solidity source files (add your contracts here)
├── test/                   # Test suite
├── ignition/               # Hardhat Ignition deployment modules
│   └── modules/            # Deployment module templates
├── helper/                 # Helper utilities
│   ├── wallet.ts           # HD wallet derivation functions
│   ├── wallet.info.ts      # Wallet info CLI tool
│   └── store.args.ts       # Constructor args storage
├── exports/                # NPM package exports
│   ├── index.ts            # Main export file
│   ├── address.config.ts   # Chain configurations
│   └── address.types.ts    # Chain type definitions
├── abi/                    # Generated contract ABIs (auto-generated)
├── typechain/              # TypeScript bindings (auto-generated)
└── artifacts/              # Compilation artifacts (auto-generated)
```

## Setup

1. Install dependencies:

```bash
yarn install
```

2. Configure environment:

```bash
cp .env.example .env
```

Edit `.env` and add:

-   `DEPLOYER_SEED`: Your mnemonic phrase (12-24 words)
-   `DEPLOYER_SEED_INDEX`: Derivation index (default: 1)
-   `ALCHEMY_RPC_KEY`: Alchemy API key for RPC access
-   `ETHERSCAN_API`: Etherscan API key for contract verification

## Available Scripts

### Development

```bash
# Compile contracts
yarn compile

# Run tests
yarn test

# Run test coverage
yarn coverage

# Check wallet info from seed
yarn wallet:info
```

### Deployment

```bash
# Deploy using Hardhat Ignition
yarn deploy ignition/modules/<module>.ts --network <network-name> --verify --deployment-id <deployment-id>

# Example: Deploy to Sepolia testnet
yarn deploy ignition/modules/<module>.ts --network sepolia --verify --deployment-id <deployment-id>
```

### Verification

**Manual Verification:**

```bash
npx hardhat verify --network mainnet --constructor-args ./ignition/constructor-args/$FILE.js $ADDRESS
npx hardhat ignition verify $DEPLOYMENT --include-unrelated-contracts
```

## Supported Networks

The Hardhat configuration includes support for:

-   **Testnets**: Sepolia
-   **Mainnets**: Ethereum, Polygon, Optimism, Arbitrum, Base, Avalanche, Gnosis, Sonic

Network-specific settings can be configured in `hardhat.config.ts`.

## Chain Configuration

The package exports chain configurations with IDs and Chainlink CCIP selectors:

```typescript
import { ADDRESS, SupportedChains, SupportedChainIds } from '@wrytes/usdu-finance-utils';

// Access chain IDs and selectors
const mainnetConfig = ADDRESS[1]; // { chainId: 1, chainSelector: '...' }

// Get all supported chains
const chains = SupportedChains; // { mainnet, polygon, arbitrum, ... }
const chainIds = SupportedChainIds; // [1, 137, 42161, ...]
```

## Development Workflow

### Adding Contracts

1. Create your Solidity contracts in the `contracts/` directory
2. Compile contracts: `yarn compile`
3. Run tests: `yarn test`
4. Generate coverage report: `yarn coverage`

### Creating Deployment Modules

1. Create a new deployment module in `ignition/modules/`
2. Use `PermissionERC1271.ts` as a template
3. Update the contract name, parameters, and constructor arguments
4. Deploy using: `yarn deploy ignition/modules/YourContract.ts --network <network>`

## Deployment

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
yarn deploy ignition/modules/YourContract.ts --network localhost --deployment-id local-dev
```

### Testnet Deployment

```bash
# Deploy to Sepolia
yarn deploy ignition/modules/YourContract.ts --network sepolia --verify --deployment-id sepolia-v1
```

### Mainnet Deployment

```bash
# Deploy to mainnet
yarn deploy ignition/modules/YourContract.ts --network mainnet --verify --deployment-id mainnet-v1
```

## Publishing as NPM Package

The package is configured to be published as `@wrytes/usdu-finance-utils`:

```bash
# Build the package
yarn npm:build

# Publish to npm (requires authentication)
yarn npm:publish
```

The package exports chain configurations and types that can be imported by other projects.

## Resources

-   [Hardhat Documentation](https://hardhat.org/docs)
-   [Hardhat Ignition](https://hardhat.org/ignition/docs/getting-started)
-   [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
-   [Aragon OSx Documentation](https://devs.aragon.org/)
-   [Viem Documentation](https://viem.sh/)
-   [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## License

GPL-3.0
