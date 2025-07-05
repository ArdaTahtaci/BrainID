import { Router, Request, Response, NextFunction } from 'express';
import {
    createSimpleIdentity,
    createSimpleGroup,
    addMemberToGroup,
    generateSimpleProof,
    verifySimpleProof,
    SimpleGroup
} from '../services/proof-simple';
import {
    saveGroup,
    getGroup,
    getAllGroups,
    StoredGroup
} from '../services/merkle';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', service: 'Simple Proof API' });
});

// Create identity from EEG features
router.post('/identity/create', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eegFeatures } = req.body as { eegFeatures: number[] };

        if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
            res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
            return;
        }

        const identity = await createSimpleIdentity(eegFeatures);

        res.json({
            success: true,
            identity,
            message: 'Simple identity created successfully'
        });
        return;
    } catch (err: any) {
        next(err);
    }
});

// Create group
router.post('/group/create', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, memberEEGFeatures } = req.body as {
            groupId: string;
            memberEEGFeatures?: number[][];
        };

        if (!groupId || typeof groupId !== 'string') {
            res.status(400).json({ error: 'groupId must be a string' });
            return;
        }

        const existingGroup = await getGroup(groupId);
        if (existingGroup) {
            res.status(400).json({ error: 'Group already exists' });
            return;
        }

        let memberCommitments: string[] = [];

        if (memberEEGFeatures && Array.isArray(memberEEGFeatures)) {
            for (const features of memberEEGFeatures) {
                const identity = await createSimpleIdentity(features);
                memberCommitments.push(identity.commitment);
            }
        }

        const group = createSimpleGroup(groupId, memberCommitments);

        const storedGroup: StoredGroup = {
            id: groupId,
            members: group.members,
            root: group.root,
            depth: 20, // default depth for simple groups
            created: Date.now()
        };

        await saveGroup(groupId, storedGroup);

        res.json({
            success: true,
            group,
            message: 'Group created successfully'
        });
        return;
    } catch (err: any) {
        next(err);
    }
});

// Add member to group
router.post('/group/:groupId/member/add', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const { eegFeatures } = req.body as { eegFeatures: number[] };

        if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
            res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
            return;
        }

        const storedGroup = await getGroup(groupId);
        if (!storedGroup) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        const group: SimpleGroup = {
            id: storedGroup.id,
            members: storedGroup.members,
            root: storedGroup.root
        };

        const identity = await createSimpleIdentity(eegFeatures);
        const updatedGroup = addMemberToGroup(group, identity.commitment);

        const updatedStoredGroup: StoredGroup = {
            id: groupId,
            members: updatedGroup.members,
            root: updatedGroup.root,
            depth: storedGroup.depth,
            created: storedGroup.created
        };

        await saveGroup(groupId, updatedStoredGroup);

        res.json({
            success: true,
            group: updatedGroup,
            addedIdentity: identity,
            message: 'Member added successfully'
        });
        return;
    } catch (err: any) {
        next(err);
    }
});

// Generate proof
router.post('/proof/generate', async (req: Request, res: Response, next: NextFunction) => {
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

        const group = await getGroup(groupId);
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        const proofResult = await generateSimpleProof(
            eegFeatures,
            group,
            message || 'default message'
        );

        if (!proofResult.success) {
            res.status(400).json({
                success: false,
                error: proofResult.error,
                message: 'Failed to generate proof'
            });
            return;
        }

        res.json({
            success: true,
            proof: proofResult.proof,
            message: 'Proof generated successfully'
        });
        return;
    } catch (err: any) {
        next(err);
    }
});

// Verify proof
router.post('/proof/verify', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { proof, groupId } = req.body as {
            proof: any;
            groupId: string;
        };

        if (!proof) {
            res.status(400).json({ error: 'proof is required' });
            return;
        }

        if (!groupId || typeof groupId !== 'string') {
            res.status(400).json({ error: 'groupId must be a string' });
            return;
        }

        const group = await getGroup(groupId);
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        const isValid = verifySimpleProof(proof, group.root);

        res.json({
            success: true,
            valid: isValid,
            message: isValid ? 'Proof is valid' : 'Proof is invalid'
        });
        return;
    } catch (err: any) {
        next(err);
    }
});

// Get group info
router.get('/group/:groupId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;

        const storedGroup = await getGroup(groupId);
        if (!storedGroup) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        const group: SimpleGroup = {
            id: storedGroup.id,
            members: storedGroup.members,
            root: storedGroup.root
        };

        res.json({
            success: true,
            group,
            message: 'Group information retrieved successfully'
        });
        return;
    } catch (err: any) {
        next(err);
    }
});

// List all groups
router.get('/groups', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allGroups = await getAllGroups();
        const groupList = allGroups.map(storedGroup => ({
            id: storedGroup.id,
            memberCount: storedGroup.members.length,
            root: storedGroup.root
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
});

export default router; 