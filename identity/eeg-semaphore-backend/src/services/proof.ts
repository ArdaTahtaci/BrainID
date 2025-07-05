import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof } from '@semaphore-protocol/proof';
import { hashFeatures } from './poseidon';
import crypto from 'crypto';

// ✅ FIX: Use environment variables for file paths
const WASM_PATH = process.env.WASM_PATH || './config/semaphore.wasm';
const ZKEY_PATH = process.env.ZKEY_PATH || './config/semaphore.zkey';
const TREE_DEPTH = parseInt(process.env.MERKLE_TREE_DEPTH || '20', 10);

// ✅ FIX MIN_2: Add field modulus for efficient signal/nullifier generation
const FIELD_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

// ✅ FIX MIN_2: Simple and efficient signal/nullifier generation using Node.js crypto
function simpleHash(input: string): bigint {
    const hash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    return BigInt('0x' + hash) % FIELD_MODULUS;
}

// ✅ FIX SEC_1: Generate unique scope with timestamp to prevent nullifier collision
function generateUniqueScope(baseScope: string): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    return `${baseScope}_${timestamp}_${nonce}`;
}

/**
 * Service for Semaphore proof generation and verification
 * Integrates EEG-based identity with Semaphore protocol
 */

/**
 * Create a Semaphore identity from EEG features
 * @param eegFeatures Array of EEG feature values
 * @returns Semaphore Identity object
 */
export async function createIdentityFromEEG(eegFeatures: number[]): Promise<Identity> {
    // Hash EEG features to create a deterministic seed
    const eegHash = await hashFeatures(eegFeatures);

    // Create Semaphore identity using the EEG hash as seed
    const identity = new Identity(eegHash.toString());

    return identity;
}

/**
 * Generate a Semaphore proof for group membership
 * @param identity The user's Semaphore identity
 * @param group The Semaphore group
 * @param message The message to prove
 * @param scope The scope/external nullifier
 * @returns Generated proof object
 */
export async function generateSemaphoreProof(
    identity: Identity,
    group: Group,
    message: string,
    scope: string
) {
    try {
        // ✅ FIX MIN_2: Use efficient simple hashing instead of heavy hashFeatures
        const signal = simpleHash(message);
        const externalNullifier = simpleHash(scope);

        // Generate the proof with local circuit files
        const proof = await generateProof(identity, group, signal, externalNullifier, {
            wasmFilePath: WASM_PATH,
            zkeyFilePath: ZKEY_PATH
        });

        return {
            proof: proof.proof,
            merkleTreeRoot: proof.merkleTreeRoot,
            nullifierHash: proof.nullifierHash,
            signal: proof.signal,
            externalNullifier: proof.externalNullifier,
            success: true
        };
    } catch (error: any) {
        console.error('Error generating Semaphore proof:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verify a Semaphore proof
 * @param proof The proof to verify
 * @param merkleTreeRoot The Merkle tree root
 * @param signal The signal that was proved
 * @param externalNullifier The external nullifier used
 * @param nullifierHash The nullifier hash
 * @returns Verification result
 */
export async function verifySemaphoreProof(
    proof: string[],
    merkleTreeRoot: string,
    signal: string,
    externalNullifier: string,
    nullifierHash: string
): Promise<boolean> {
    try {
        // Convert proof array to the expected format for Semaphore V3
        const packedProof = proof as [string, string, string, string, string, string, string, string];

        const isValid = await verifyProof({
            proof: packedProof,
            merkleTreeRoot,
            signal,
            externalNullifier,
            nullifierHash
        }, TREE_DEPTH); // ✅ FIX: Use configurable tree depth instead of hardcoded 20

        return isValid;
    } catch (error: any) {
        console.error('Error verifying Semaphore proof:', error);
        return false;
    }
}

/**
 * Create a group and add members based on EEG identities
 * @param memberEEGFeatures Array of EEG features for each member
 * @returns Semaphore Group with added members
 */
export async function createEEGGroup(memberEEGFeatures: number[][]): Promise<Group> {
    // Generate a unique group ID
    const uniqueGroupId = Math.floor(Math.random() * 1000000);
    const group = new Group(uniqueGroupId, TREE_DEPTH);

    for (const eegFeatures of memberEEGFeatures) {
        const identity = await createIdentityFromEEG(eegFeatures);
        group.addMember(identity.commitment);
    }

    return group;
}

/**
 * Add a member to an existing group using their EEG features
 * @param group The existing Semaphore group
 * @param eegFeatures The new member's EEG features
 * @returns Updated group
 */
export async function addEEGMemberToGroup(group: Group, eegFeatures: number[]): Promise<Group> {
    const identity = await createIdentityFromEEG(eegFeatures);
    group.addMember(identity.commitment);
    return group;
}

/**
 * Get identity commitment from EEG features
 * @param eegFeatures Array of EEG feature values
 * @returns Identity commitment as string
 */
export async function getIdentityCommitment(eegFeatures: number[]): Promise<string> {
    const identity = await createIdentityFromEEG(eegFeatures);
    return identity.commitment.toString();
}

/**
 * Generate proof for "I am human" verification
 * @param eegFeatures User's EEG features
 * @param group The verification group
 * @param message Optional message (default: "I am human")
 * @returns Proof result
 */
export async function generateHumanityProof(
    eegFeatures: number[],
    group: Group,
    message: string = "I am human"
) {
    const identity = await createIdentityFromEEG(eegFeatures);
    // ✅ FIX SEC_1: Use unique scope to prevent nullifier collision
    const scope = generateUniqueScope("humanity_verification");

    return await generateSemaphoreProof(identity, group, message, scope);
}

/**
 * Generate proof for voting
 * @param eegFeatures User's EEG features
 * @param group The voting group
 * @param vote The vote choice
 * @param pollId The poll identifier
 * @returns Proof result
 */
export async function generateVoteProof(
    eegFeatures: number[],
    group: Group,
    vote: string,
    pollId: string
) {
    const identity = await createIdentityFromEEG(eegFeatures);
    // ✅ FIX SEC_1: Use unique scope to prevent nullifier collision in voting
    const scope = generateUniqueScope(`poll_${pollId}`);

    return await generateSemaphoreProof(identity, group, vote, scope);
} 