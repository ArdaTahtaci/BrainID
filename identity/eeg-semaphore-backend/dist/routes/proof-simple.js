"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proof_simple_1 = require("../services/proof-simple");
const merkle_1 = require("../services/merkle");
const router = (0, express_1.Router)();
// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Simple Proof API' });
});
// Create identity from EEG features
router.post('/identity/create', async (req, res, next) => {
    try {
        const { eegFeatures } = req.body;
        if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
            res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
            return;
        }
        const identity = await (0, proof_simple_1.createSimpleIdentity)(eegFeatures);
        res.json({
            success: true,
            identity,
            message: 'Simple identity created successfully'
        });
        return;
    }
    catch (err) {
        next(err);
    }
});
// Create group
router.post('/group/create', async (req, res, next) => {
    try {
        const { groupId, memberEEGFeatures } = req.body;
        if (!groupId || typeof groupId !== 'string') {
            res.status(400).json({ error: 'groupId must be a string' });
            return;
        }
        const existingGroup = await (0, merkle_1.getGroup)(groupId);
        if (existingGroup) {
            res.status(400).json({ error: 'Group already exists' });
            return;
        }
        let memberCommitments = [];
        if (memberEEGFeatures && Array.isArray(memberEEGFeatures)) {
            for (const features of memberEEGFeatures) {
                const identity = await (0, proof_simple_1.createSimpleIdentity)(features);
                memberCommitments.push(identity.commitment);
            }
        }
        const group = (0, proof_simple_1.createSimpleGroup)(groupId, memberCommitments);
        const storedGroup = {
            id: groupId,
            members: group.members,
            root: group.root,
            depth: 20, // default depth for simple groups
            created: Date.now()
        };
        await (0, merkle_1.saveGroup)(groupId, storedGroup);
        res.json({
            success: true,
            group,
            message: 'Group created successfully'
        });
        return;
    }
    catch (err) {
        next(err);
    }
});
// Add member to group
router.post('/group/:groupId/member/add', async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { eegFeatures } = req.body;
        if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
            res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
            return;
        }
        const storedGroup = await (0, merkle_1.getGroup)(groupId);
        if (!storedGroup) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const group = {
            id: storedGroup.id,
            members: storedGroup.members,
            root: storedGroup.root
        };
        const identity = await (0, proof_simple_1.createSimpleIdentity)(eegFeatures);
        const updatedGroup = (0, proof_simple_1.addMemberToGroup)(group, identity.commitment);
        const updatedStoredGroup = {
            id: groupId,
            members: updatedGroup.members,
            root: updatedGroup.root,
            depth: storedGroup.depth,
            created: storedGroup.created
        };
        await (0, merkle_1.saveGroup)(groupId, updatedStoredGroup);
        res.json({
            success: true,
            group: updatedGroup,
            addedIdentity: identity,
            message: 'Member added successfully'
        });
        return;
    }
    catch (err) {
        next(err);
    }
});
// Generate proof
router.post('/proof/generate', async (req, res, next) => {
    try {
        const { eegFeatures, groupId, message } = req.body;
        if (!Array.isArray(eegFeatures) || eegFeatures.length === 0) {
            res.status(400).json({ error: 'eegFeatures must be a non-empty array of numbers' });
            return;
        }
        if (!groupId || typeof groupId !== 'string') {
            res.status(400).json({ error: 'groupId must be a string' });
            return;
        }
        const group = await (0, merkle_1.getGroup)(groupId);
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const proofResult = await (0, proof_simple_1.generateSimpleProof)(eegFeatures, group, message || 'default message');
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
    }
    catch (err) {
        next(err);
    }
});
// Verify proof
router.post('/proof/verify', async (req, res, next) => {
    try {
        const { proof, groupId } = req.body;
        if (!proof) {
            res.status(400).json({ error: 'proof is required' });
            return;
        }
        if (!groupId || typeof groupId !== 'string') {
            res.status(400).json({ error: 'groupId must be a string' });
            return;
        }
        const group = await (0, merkle_1.getGroup)(groupId);
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const isValid = (0, proof_simple_1.verifySimpleProof)(proof, group.root);
        res.json({
            success: true,
            valid: isValid,
            message: isValid ? 'Proof is valid' : 'Proof is invalid'
        });
        return;
    }
    catch (err) {
        next(err);
    }
});
// Get group info
router.get('/group/:groupId', async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const storedGroup = await (0, merkle_1.getGroup)(groupId);
        if (!storedGroup) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        const group = {
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
    }
    catch (err) {
        next(err);
    }
});
// List all groups
router.get('/groups', async (req, res, next) => {
    try {
        const allGroups = await (0, merkle_1.getAllGroups)();
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
