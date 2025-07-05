"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIdentityFromEEG = createIdentityFromEEG;
exports.generateSemaphoreProof = generateSemaphoreProof;
exports.verifySemaphoreProof = verifySemaphoreProof;
exports.createEEGGroup = createEEGGroup;
exports.addEEGMemberToGroup = addEEGMemberToGroup;
exports.getIdentityCommitment = getIdentityCommitment;
exports.generateHumanityProof = generateHumanityProof;
exports.generateVoteProof = generateVoteProof;
const identity_1 = require("@semaphore-protocol/identity");
const group_1 = require("@semaphore-protocol/group");
const proof_1 = require("@semaphore-protocol/proof");
const poseidon_1 = require("./poseidon");
const crypto_1 = __importDefault(require("crypto"));
// ✅ FIX: Use environment variables for file paths
const WASM_PATH = process.env.WASM_PATH || './config/semaphore.wasm';
const ZKEY_PATH = process.env.ZKEY_PATH || './config/semaphore.zkey';
const TREE_DEPTH = parseInt(process.env.MERKLE_TREE_DEPTH || '20', 10);
// ✅ FIX MIN_2: Add field modulus for efficient signal/nullifier generation
const FIELD_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
// ✅ FIX MIN_2: Simple and efficient signal/nullifier generation using Node.js crypto
function simpleHash(input) {
    const hash = crypto_1.default.createHash('sha256').update(input, 'utf8').digest('hex');
    return BigInt('0x' + hash) % FIELD_MODULUS;
}
// ✅ FIX SEC_1: Generate unique scope with timestamp to prevent nullifier collision
function generateUniqueScope(baseScope) {
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
async function createIdentityFromEEG(eegFeatures) {
    // Hash EEG features to create a deterministic seed
    const eegHash = await (0, poseidon_1.hashFeatures)(eegFeatures);
    // Create Semaphore identity using the EEG hash as seed
    const identity = new identity_1.Identity(eegHash.toString());
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
async function generateSemaphoreProof(identity, group, message, scope) {
    try {
        // ✅ FIX MIN_2: Use efficient simple hashing instead of heavy hashFeatures
        const signal = simpleHash(message);
        const externalNullifier = simpleHash(scope);
        // Generate the proof with local circuit files
        const proof = await (0, proof_1.generateProof)(identity, group, signal, externalNullifier, {
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
    }
    catch (error) {
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
async function verifySemaphoreProof(proof, merkleTreeRoot, signal, externalNullifier, nullifierHash) {
    try {
        // Convert proof array to the expected format for Semaphore V3
        const packedProof = proof;
        const isValid = await (0, proof_1.verifyProof)({
            proof: packedProof,
            merkleTreeRoot,
            signal,
            externalNullifier,
            nullifierHash
        }, TREE_DEPTH); // ✅ FIX: Use configurable tree depth instead of hardcoded 20
        return isValid;
    }
    catch (error) {
        console.error('Error verifying Semaphore proof:', error);
        return false;
    }
}
/**
 * Create a group and add members based on EEG identities
 * @param memberEEGFeatures Array of EEG features for each member
 * @returns Semaphore Group with added members
 */
async function createEEGGroup(memberEEGFeatures) {
    // Generate a unique group ID
    const uniqueGroupId = Math.floor(Math.random() * 1000000);
    const group = new group_1.Group(uniqueGroupId, TREE_DEPTH);
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
async function addEEGMemberToGroup(group, eegFeatures) {
    const identity = await createIdentityFromEEG(eegFeatures);
    group.addMember(identity.commitment);
    return group;
}
/**
 * Get identity commitment from EEG features
 * @param eegFeatures Array of EEG feature values
 * @returns Identity commitment as string
 */
async function getIdentityCommitment(eegFeatures) {
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
async function generateHumanityProof(eegFeatures, group, message = "I am human") {
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
async function generateVoteProof(eegFeatures, group, vote, pollId) {
    const identity = await createIdentityFromEEG(eegFeatures);
    // ✅ FIX SEC_1: Use unique scope to prevent nullifier collision in voting
    const scope = generateUniqueScope(`poll_${pollId}`);
    return await generateSemaphoreProof(identity, group, vote, scope);
}
