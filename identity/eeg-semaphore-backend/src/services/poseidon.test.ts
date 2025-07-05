import { hashFeatures } from './poseidon';

describe('hashFeatures', () => {
    it('should return a bigint and be deterministic for the same input', async () => {
        const features = [1, 2, 3, 4, 5];
        const hash1 = await hashFeatures(features);
        const hash2 = await hashFeatures(features);
        expect(typeof hash1).toBe('bigint');
        expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
        const featuresA = [1, 2, 3];
        const featuresB = [3, 2, 1];
        const hashA = await hashFeatures(featuresA);
        const hashB = await hashFeatures(featuresB);
        expect(hashA).not.toBe(hashB);
    });
}); 