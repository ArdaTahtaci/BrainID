"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashFeatures = hashFeatures;
// src/services/poseidon.ts
const circomlibjs_1 = require("circomlibjs");
const FIELD_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
function toField(x) {
    return BigInt(Math.floor(x)) % FIELD_MODULUS;
}
async function hashFeatures(features) {
    const poseidon = await (0, circomlibjs_1.buildPoseidon)();
    let h = BigInt(0); // başlangıç “sünger” değeri
    for (const x of features) {
        const hashResult = poseidon([h, toField(x)]);
        // Convert field element to BigInt properly
        h = BigInt(poseidon.F.toString(hashResult));
    }
    return h;
}
