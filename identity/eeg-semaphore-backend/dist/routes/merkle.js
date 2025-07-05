"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/merkle.ts
const express_1 = require("express");
const merkle_1 = require("../services/merkle");
const proof_1 = require("../services/proof");
const router = (0, express_1.Router)(); // <-- kesinlikle express() veya default import değil
// 1) Sağlık kontrolü
router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});
// 2) EEG özelliklerini al, Identity commitment üret, Merkle ağacına ekle
router.post('/add', async (req, res, next) => {
    try {
        const { features } = req.body;
        if (!Array.isArray(features)) {
            res.status(400).json({ error: 'features must be an array of numbers' });
            return;
        }
        const identity = await (0, proof_1.createIdentityFromEEG)(features);
        const leafHash = BigInt(identity.commitment.toString());
        const index = await (0, merkle_1.addLeaf)(leafHash);
        res.json({
            index,
            leafHash: leafHash.toString(),
            identityCommitment: identity.commitment.toString()
        });
        return;
    }
    catch (err) {
        next(err);
    }
});
// 3) Bir yaprak için proof üret
router.post('/proof', async (req, res, next) => {
    try {
        const { index } = req.body;
        if (typeof index !== 'number') {
            res.status(400).json({ error: 'index must be a number' });
            return;
        }
        const proof = await (0, merkle_1.generateProof)(index);
        res.json(proof);
        return;
    }
    catch (err) {
        next(err);
    }
});
// 4) Güncel Merkle root'u döner
router.get('/root', async (_req, res, next) => {
    try {
        const root = await (0, merkle_1.getRoot)();
        res.json({ root });
        return;
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
