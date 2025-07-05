// src/services/poseidon.ts
import { buildPoseidon } from 'circomlibjs';

const FIELD_MODULUS = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

function toField(x: number): bigint {
    return BigInt(Math.floor(x)) % FIELD_MODULUS;
}


export async function hashFeatures(features: number[]): Promise<bigint> {
    const poseidon = await buildPoseidon();
    let h = BigInt(0);                         // başlangıç “sünger” değeri
    for (const x of features) {
        const hashResult = poseidon([h, toField(x)]);
        // Convert field element to BigInt properly
        h = BigInt(poseidon.F.toString(hashResult));
    }
    return h;
}
