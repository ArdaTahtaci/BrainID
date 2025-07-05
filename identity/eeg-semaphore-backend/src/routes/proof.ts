import { Router, Request, Response, NextFunction } from 'express';
import {
    createIdentityFromEEG,
    generateSemaphoreProof,
    verifySemaphoreProof,
    createEEGGroup,
    addEEGMemberToGroup,
    getIdentityCommitment,
    generateHumanityProof,
    generateVoteProof
} from '../services/proof';
import { Group } from '@semaphore-protocol/group';
import {
    saveGroup,
    getGroup,
    getAllGroups,
    StoredGroup
} from '../services/merkle';

// ✅ FIX: Use configurable tree depth
const TREE_DEPTH = parseInt(process.env.MERKLE_TREE_DEPTH || '20', 10);

// Helper function to convert StoredGroup to Semaphore Group
function storedGroupToGroup(storedGroup: StoredGroup): Group {
    // Convert string ID to numeric hash for Semaphore Group
    const numericId = stringToNumericId(storedGroup.id);
    const group = new Group(numericId, storedGroup.depth);
    for (const member of storedGroup.members) {
        group.addMember(member);
    }
    return group;
}

// Helper function to convert string ID to numeric ID
function stringToNumericId(stringId: string): number {
    // Create a simple hash from string ID
    let hash = 0;
    for (let i = 0; i < stringId.length; i++) {
        const char = stringId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Helper function to convert Group to StoredGroup
function groupToStoredGroup(groupId: string, group: Group, created?: number): StoredGroup {
    return {
        id: groupId,
        members: group.members.map(m => m.toString()),
        root: group.root?.toString() || '0',
        depth: group.depth,
        created: created || Date.now()
    };
}

const router = Router();

// ✅ REMOVE: In-memory storage - now using persistent storage
// const groups = new Map<string, Group>();

// 1) Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', service: 'Proof Generation API' });
});

// 2) Generate identity commitment from EEG features
router.post(
    '/identity/create',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { eegFeatures } = req.body as { eegFeatures: number[] };

            if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
                res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
                return;
            }

            const commitment = await getIdentityCommitment(eegFeatures);

            res.json({
                success: true,
                identityCommitment: commitment,
                message: 'Identity commitment generated successfully'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 3) Create a new group
router.post(
    '/group/create',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { groupId, memberEEGFeatures } = req.body as {
                groupId: string;
                memberEEGFeatures: number[][];
            };

            if (!groupId || typeof groupId !== 'string') {
                res.status(400).json({ error: 'groupId must be a string' });
                return;
            }

            // ✅ CHECK: Group exists in database
            const existingGroup = await getGroup(groupId);
            if (existingGroup) {
                res.status(400).json({ error: 'Group already exists' });
                return;
            }

            let group: Group;

            if (memberEEGFeatures && Array.isArray(memberEEGFeatures)) {
                group = await createEEGGroup(memberEEGFeatures);
            } else {
                // Use numeric hash of the groupId for consistent identification
                const numericId = stringToNumericId(groupId);
                group = new Group(numericId, TREE_DEPTH);
            }

            // ✅ SAVE: Group to database
            const storedGroup = groupToStoredGroup(groupId, group);
            await saveGroup(groupId, storedGroup);

            res.json({
                success: true,
                groupId,
                memberCount: group.members.length,
                root: group.root?.toString() || '0',
                message: 'Group created successfully'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 4) Add member to existing group
router.post(
    '/group/add-member',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { groupId, memberEEGFeatures } = req.body as { groupId: string; memberEEGFeatures: number[] };
            const eegFeatures = memberEEGFeatures;

            if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
                res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
                return;
            }

            const storedGroup = await getGroup(groupId);
            if (!storedGroup) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            // Convert stored group to actual Group object
            const group = storedGroupToGroup(storedGroup);
            const updatedGroup = await addEEGMemberToGroup(group, eegFeatures);

            // Save updated group
            const updatedStoredGroup = groupToStoredGroup(groupId, updatedGroup, storedGroup.created);
            await saveGroup(groupId, updatedStoredGroup);

            const commitment = await getIdentityCommitment(eegFeatures);

            res.json({
                success: true,
                groupId,
                identityCommitment: commitment,
                memberCount: updatedGroup.members.length,
                root: updatedGroup.root?.toString() || '0',
                message: 'Member added successfully'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 5) Generate humanity proof
router.post(
    '/humanity',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { eegFeatures, groupId, message } = req.body as {
                eegFeatures: number[];
                groupId: string;
                message?: string;
            };

            if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
                res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
                return;
            }

            if (!groupId || typeof groupId !== 'string') {
                res.status(400).json({ error: 'groupId must be a string' });
                return;
            }

            const storedGroup = await getGroup(groupId);
            if (!storedGroup) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            // Convert stored group to actual Group object
            const group = storedGroupToGroup(storedGroup);
            const proofResult = await generateHumanityProof(eegFeatures, group, message);

            if (!proofResult.success) {
                res.status(500).json({
                    success: false,
                    error: proofResult.error,
                    message: 'Failed to generate proof'
                });
                return;
            }

            res.json({
                success: true,
                proof: proofResult.proof,
                merkleTreeRoot: proofResult.merkleTreeRoot?.toString(),
                nullifierHash: proofResult.nullifierHash?.toString(),
                signal: proofResult.signal?.toString(),
                externalNullifier: proofResult.externalNullifier?.toString(),
                message: 'Humanity proof generated successfully'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 6) Generate vote proof
router.post(
    '/vote',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { eegFeatures, groupId, vote, pollId } = req.body as {
                eegFeatures: number[];
                groupId: string;
                vote: string;
                pollId: string;
            };

            if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
                res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
                return;
            }

            if (!groupId || typeof groupId !== 'string') {
                res.status(400).json({ error: 'groupId must be a string' });
                return;
            }

            if (!vote || typeof vote !== 'string') {
                res.status(400).json({ error: 'vote must be a string' });
                return;
            }

            if (!pollId || typeof pollId !== 'string') {
                res.status(400).json({ error: 'pollId must be a string' });
                return;
            }

            const storedGroup = await getGroup(groupId);
            if (!storedGroup) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            // Convert stored group to actual Group object
            const group = storedGroupToGroup(storedGroup);
            const proofResult = await generateVoteProof(eegFeatures, group, vote, pollId);

            if (!proofResult.success) {
                res.status(500).json({
                    success: false,
                    error: proofResult.error,
                    message: 'Failed to generate vote proof'
                });
                return;
            }

            res.json({
                success: true,
                proof: proofResult.proof,
                merkleTreeRoot: proofResult.merkleTreeRoot?.toString(),
                nullifierHash: proofResult.nullifierHash?.toString(),
                signal: proofResult.signal?.toString(),
                externalNullifier: proofResult.externalNullifier?.toString(),
                vote,
                pollId,
                message: 'Vote proof generated successfully'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 7) Verify proof
router.post(
    '/verify',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                proof,
                merkleTreeRoot,
                signal,
                externalNullifier,
                nullifierHash
            } = req.body as {
                proof: string[];
                merkleTreeRoot: string;
                signal: string;
                externalNullifier: string;
                nullifierHash: string;
            };

            if (!Array.isArray(proof)) {
                res.status(400).json({ error: 'proof must be an array' });
                return;
            }

            if (!merkleTreeRoot || !signal || !externalNullifier || !nullifierHash) {
                res.status(400).json({ error: 'Missing required proof parameters' });
                return;
            }

            const isValid = await verifySemaphoreProof(
                proof,
                merkleTreeRoot,
                signal,
                externalNullifier,
                nullifierHash
            );

            res.json({
                success: true,
                verified: isValid,
                message: isValid ? 'Proof is valid' : 'Proof is invalid'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 8) Get group info
router.get(
    '/group/:groupId',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { groupId } = req.params;

            const storedGroup = await getGroup(groupId);
            if (!storedGroup) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            res.json({
                success: true,
                groupId,
                memberCount: storedGroup.members.length,
                root: storedGroup.root,
                depth: storedGroup.depth,
                message: 'Group information retrieved successfully'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 9) List all groups
router.get(
    '/groups',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const allGroups = await getAllGroups();
            const groupList = allGroups.map(storedGroup => ({
                groupId: storedGroup.id,
                memberCount: storedGroup.members.length,
                root: storedGroup.root,
                depth: storedGroup.depth
            }));

            res.json({
                success: true,
                groups: groupList,
                totalGroups: groupList.length,
                message: 'Groups retrieved successfully'
            });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

export default router; 