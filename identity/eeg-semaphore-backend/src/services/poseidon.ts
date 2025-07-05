// src/services/poseidon.ts
import { poseidon2 } from 'poseidon-lite';

const FIELD_MODULUS = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

/** number → field-uyumlu bigint */
function toField(x: number): bigint {
    return BigInt(Math.floor(x)) % FIELD_MODULUS;
}

/**
 * Özellik dizisini iteratif olarak (h, xi) → h' biçiminde
 * poseidon2 ile sıkıştırır ve tek bir hash döner.
 *
 * h₀ = 0  
 * hᵢ₊₁ = poseidon2([hᵢ, xᵢ])
 */
export function hashFeatures(features: number[]): bigint {
    let h = BigInt(0);                         // başlangıç “sünger” değeri
    for (const x of features) {
        h = poseidon2([h, toField(x)]) as bigint;
    }
    return h;
}
