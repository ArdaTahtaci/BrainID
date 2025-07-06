// Contract addresses for Base Sepolia testnet - Phase 2.1 Enhanced Contracts
export const CONTRACT_ADDRESSES = {
    EEGRegistry: '0x642f08805505285Fdd841b385d158569D12aF6Ce' as `0x${string}`,
    SemaphoreVerifier: '0x929Ebe07e12C430b6C060CCe5CFa0C2515eaCfF5' as `0x${string}`,
    EEGGroup: '0x69C8724a2CecF2282127439ccc63e66DC1892eDD' as `0x${string}`,
    EEGVerifier: '0xFc72f33Eb974c5524E1769Eb8B464BBDd18EB609' as `0x${string}`,
} as const;

export const CHAIN_ID = 84532; // Base Sepolia testnet
export const NETWORK_NAME = 'Base Sepolia';
export const RPC_URL = 'https://sepolia.base.org';
export const EXPLORER_URL = 'https://sepolia.basescan.org';
export const EXPLORER_NAME = 'Base Sepolia Basescan'; 