import { buildPoseidon } from 'circomlibjs';

// Helper function to convert Uint8Array to BigInt
function uint8ArrayToBigInt(uint8Array: Uint8Array): bigint {
    let result = BigInt(0);
    for (let i = 0; i < uint8Array.length; i++) {
        result = (result << BigInt(8)) + BigInt(uint8Array[i]);
    }
    return result;
}

/**
 * Simplified proof service for testing basic functionality
 * without Semaphore dependencies
 */

export interface SimpleIdentity {
    commitment: string;
    seed: string;
}

export interface SimpleGroup {
    id: string;
    members: string[];
    root: string;
}

/**
 * Create a simple identity from EEG features
 */
export async function createSimpleIdentity(eegFeatures: number[]): Promise<SimpleIdentity> {
    const poseidon = await buildPoseidon();
    const hash = uint8ArrayToBigInt(poseidon(eegFeatures));
    const commitment = hash.toString();
    
    return {
        commitment,
        seed: hash.toString()
    };
}

/**
 * Create a simple group
 */
export function createSimpleGroup(groupId: string, memberCommitments: string[] = []): SimpleGroup {
    // Simple root calculation (in real implementation, this would be a Merkle root)
    const root = memberCommitments.length > 0 
        ? memberCommitments.reduce((acc, curr) => (BigInt(acc) ^ BigInt(curr)).toString())
        : "0";
    
    return {
        id: groupId,
        members: [...memberCommitments],
        root
    };
}

/**
 * Add member to group
 */
export function addMemberToGroup(group: SimpleGroup, commitment: string): SimpleGroup {
    const newMembers = [...group.members, commitment];
    const newRoot = newMembers.reduce((acc, curr) => (BigInt(acc) ^ BigInt(curr)).toString());
    
    return {
        ...group,
        members: newMembers,
        root: newRoot
    };
}

/**
 * Generate a simple proof (mock implementation)
 */
export async function generateSimpleProof(
    eegFeatures: number[],
    group: SimpleGroup,
    message: string
): Promise<{
    success: boolean;
    proof?: any;
    error?: string;
}> {
    try {
        const identity = await createSimpleIdentity(eegFeatures);
        
        // Check if identity is in group
        const isMember = group.members.includes(identity.commitment);
        
        if (!isMember) {
            return {
                success: false,
                error: "Identity is not a member of the group"
            };
        }
        
        // Generate mock proof
        const mockProof = {
            commitment: identity.commitment,
            groupRoot: group.root,
            message,
            timestamp: Date.now(),
            nullifier: (BigInt(identity.commitment) ^ BigInt(message.length)).toString()
        };
        
        return {
            success: true,
            proof: mockProof
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verify a simple proof (mock implementation)
 */
export function verifySimpleProof(proof: any, expectedRoot: string): boolean {
    return proof && proof.groupRoot === expectedRoot;
} 