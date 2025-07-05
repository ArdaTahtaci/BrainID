# EEG System Smart Contract Deployment Guide

## Overview

This directory contains the smart contracts for the EEG-based identity verification system using Semaphore protocol.

## Contracts

1. **SemaphoreVerifier.sol** - Verifies zero-knowledge proofs using Semaphore protocol
2. **EEGRegistry.sol** - Manages EEG identity registrations and verifications
3. **EEGVerifier.sol** - Main verification contract that combines EEG and Semaphore verification
4. **EEGGroup.sol** - Manages groups of verified EEG identities

## Prerequisites

1. Node.js and npm installed
2. MetaMask wallet with some testnet ETH
3. Infura or Alchemy API key (for testnet deployment)
4. Etherscan API key (for contract verification)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp env.example .env
   ```

3. **Configure your .env file:**
   ```
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   PRIVATE_KEY=your_metamask_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

## Deployment Options

### Option 1: Using Hardhat Ignition (Recommended)

**Local deployment (for testing):**
```bash
npx hardhat ignition deploy ignition/modules/EEGSystem.ts --network hardhat
```

**Sepolia testnet deployment:**
```bash
npx hardhat ignition deploy ignition/modules/EEGSystem.ts --network sepolia
```

### Option 2: Using the deployment script

**Local deployment:**
```bash
npx hardhat run scripts/deploy.ts --network hardhat
```

**Sepolia testnet deployment:**
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

## Contract Verification

After deployment to a testnet, verify your contracts on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

The deployment script will output the exact verification commands for each contract.

## Deployment Artifacts

- Deployment addresses are saved in `deployments/` directory
- Each deployment creates a JSON file with all contract addresses and deployment info
- TypeScript types are generated in `typechain-types/` directory

## Integration with Backend

After deployment, update your backend configuration with the deployed contract addresses:

```typescript
const contractAddresses = {
  SemaphoreVerifier: "0x...",
  EEGRegistry: "0x...", 
  EEGVerifier: "0x...",
  EEGGroup: "0x..."
};
```

## Gas Estimates

Approximate gas costs for deployment on Sepolia:

- SemaphoreVerifier: ~2,500,000 gas
- EEGRegistry: ~800,000 gas
- EEGVerifier: ~1,200,000 gas
- EEGGroup: ~2,000,000 gas

**Total: ~6,500,000 gas**

## Troubleshooting

1. **Compilation errors:** Make sure all dependencies are installed
2. **Deployment failures:** Check your account has enough ETH for gas fees
3. **Network issues:** Verify your RPC URL is correct in hardhat.config.ts
4. **Verification issues:** Ensure Etherscan API key is set and contracts are fully deployed

## Next Steps

After successful deployment:

1. Update backend with contract addresses
2. Test contract interactions using the backend API
3. Set up monitoring for contract events
4. Configure group admins and initial members 