// test-proof-format.js - Check actual proof format
require('ts-node/register');

async function testProofFormat() {
    console.log('🔍 Testing Actual Proof Format...\n');

    try {
        const { createIdentityFromEEG } = require('./src/services/proof.ts');
        const { Group } = require('@semaphore-protocol/group');
        const { generateProof } = require('@semaphore-protocol/proof');

        // Create test identity and group
        const testFeatures = [123, 456, 789];
        const identity = await createIdentityFromEEG(testFeatures);

        const group = new Group(1234, 20);
        group.addMember(identity.commitment);

        console.log('✅ Identity and group created');

        // Generate proof with BigInt message and scope, using local config files
        const proof = await generateProof(identity, group, BigInt(123), BigInt(456), {
            wasmFilePath: './config/semaphore.wasm',
            zkeyFilePath: './config/semaphore.zkey'
        });

        console.log('\n📄 Proof Object Structure:');
        console.log('Type:', typeof proof);
        console.log('Keys:', Object.keys(proof));

        console.log('\n📄 Proof.proof Structure:');
        console.log('Type:', typeof proof.proof);
        console.log('Keys:', Object.keys(proof.proof));

        // Check if it's the new format {a, b, c} or old format [string, string, ...]
        if (proof.proof && typeof proof.proof === 'object') {
            if (proof.proof.a && proof.proof.b && proof.proof.c) {
                console.log('\n✅ NEW FORMAT (v4+): {a, b, c}');
                console.log('proof.a:', Array.isArray(proof.proof.a) ? `Array[${proof.proof.a.length}]` : typeof proof.proof.a);
                console.log('proof.b:', Array.isArray(proof.proof.b) ? `Array[${proof.proof.b.length}]` : typeof proof.proof.b);
                console.log('proof.c:', Array.isArray(proof.proof.c) ? `Array[${proof.proof.c.length}]` : typeof proof.proof.c);
            } else if (Array.isArray(proof.proof)) {
                console.log('\n✅ ARRAY FORMAT: Proof is an array');
                console.log('Length:', proof.proof.length);
                console.log('First few elements:', proof.proof.slice(0, 3));
            } else {
                console.log('\n❓ UNKNOWN FORMAT');
                console.log('proof.proof:', proof.proof);
            }
        } else if (Array.isArray(proof.proof)) {
            console.log('\n✅ ARRAY FORMAT: Proof is an array');
            console.log('Length:', proof.proof.length);
        }

        console.log('\n📄 Other Fields:');
        console.log('merkleTreeRoot:', typeof proof.merkleTreeRoot);
        console.log('nullifierHash:', typeof proof.nullifierHash);
        console.log('signal:', typeof proof.signal);
        console.log('externalNullifier:', typeof proof.externalNullifier);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

testProofFormat().catch(console.error); 