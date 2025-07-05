"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const poseidon_1 = require("./poseidon");
describe('hashFeatures', () => {
    it('should return a bigint and be deterministic for the same input', async () => {
        const features = [1, 2, 3, 4, 5];
        const hash1 = await (0, poseidon_1.hashFeatures)(features);
        const hash2 = await (0, poseidon_1.hashFeatures)(features);
        expect(typeof hash1).toBe('bigint');
        expect(hash1).toBe(hash2);
    });
    it('should produce different hashes for different inputs', async () => {
        const featuresA = [1, 2, 3];
        const featuresB = [3, 2, 1];
        const hashA = await (0, poseidon_1.hashFeatures)(featuresA);
        const hashB = await (0, poseidon_1.hashFeatures)(featuresB);
        expect(hashA).not.toBe(hashB);
    });
});
