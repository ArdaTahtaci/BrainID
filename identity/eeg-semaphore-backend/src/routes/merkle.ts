// src/routes/merkle.ts
import { Router, Request, Response, NextFunction } from 'express';
import { hashFeatures } from '../services/poseidon';
import { addLeaf, generateProof, getRoot } from '../services/merkle';

const router = Router();  // <-- kesinlikle express() veya default import değil

// 1) Sağlık kontrolü
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK' });
});

// 2) EEG özelliklerini al, Poseidon hash’le, Merkle ağacına ekle
router.post(
    '/add',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { features } = req.body as { features: number[] };
            if (!Array.isArray(features)) {
                res.status(400).json({ error: 'features must be an array of numbers' });
                return;
            }

            const leafHash = hashFeatures(features);
            const index = await addLeaf(leafHash);

            res.json({ index, leafHash: leafHash.toString() });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 3) Bir yaprak için proof üret
router.post(
    '/proof',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { index } = req.body as { index: number };
            if (typeof index !== 'number') {
                res.status(400).json({ error: 'index must be a number' });
                return;
            }

            const proof = await generateProof(index);
            res.json(proof);
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

// 4) Güncel Merkle root’u döner
router.get(
    '/root',
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const root = await getRoot();
            res.json({ root });
            return;
        } catch (err: any) {
            next(err);
        }
    }
);

export default router;
