"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSimpleIdentity = createSimpleIdentity;
exports.createSimpleGroup = createSimpleGroup;
exports.addMemberToGroup = addMemberToGroup;
exports.generateSimpleProof = generateSimpleProof;
exports.verifySimpleProof = verifySimpleProof;
const circomlibjs_1 = require("circomlibjs");
// Helper function to convert Uint8Array to BigInt
function uint8ArrayToBigInt(uint8Array) {
    let result = BigInt(0);
    for (let i = 0; i < uint8Array.length; i++) {
        result = (result << BigInt(8)) + BigInt(uint8Array[i]);
    }
    return result;
}
/**
 * Create a simple identity from EEG features
 */
async function createSimpleIdentity(eegFeatures) {
    const poseidon = await (0, circomlibjs_1.buildPoseidon)();
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
function createSimpleGroup(groupId, memberCommitments = []) {
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
function addMemberToGroup(group, commitment) {
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
async function generateSimpleProof(eegFeatures, group, message) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Verify a simple proof (mock implementation)
 */
function verifySimpleProof(proof, expectedRoot) {
    return proof && proof.groupRoot === expectedRoot;
}
