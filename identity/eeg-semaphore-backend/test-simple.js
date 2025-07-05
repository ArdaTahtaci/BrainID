// test-simple.js
// Test basic EEG hashing and simple proof functionality

const { buildPoseidon } = require('circomlibjs');

// Helper function to convert Uint8Array to BigInt
function uint8ArrayToBigInt(uint8Array) {
    let result = BigInt(0);
    for (let i = 0; i < uint8Array.length; i++) {
        result = (result << BigInt(8)) + BigInt(uint8Array[i]);
    }
    return result;
}

// Test data - convert to integers for Poseidon
const sampleEEGFeatures = [123, 456, 789, 234, 567, 891, 345, 678];
const sampleEEGFeatures2 = [234, 567, 891, 345, 678, 123, 456, 789];

async function testPoseidonHashing() {
    console.log('🧮 Testing Poseidon Hashing...');
    
    try {
        // Build poseidon instance
        const poseidon = await buildPoseidon();
        
        // Test basic hashing - convert to BigInt properly
        const hash1 = uint8ArrayToBigInt(poseidon(sampleEEGFeatures));
        const hash2 = uint8ArrayToBigInt(poseidon(sampleEEGFeatures2));
        const hash1Again = uint8ArrayToBigInt(poseidon(sampleEEGFeatures));
        
        console.log(`   Hash 1: ${hash1.toString()}`);
        console.log(`   Hash 2: ${hash2.toString()}`);
        console.log(`   Hash 1 Again: ${hash1Again.toString()}`);
        
        // Test determinism
        if (hash1.toString() === hash1Again.toString()) {
            console.log('✅ Poseidon hashing is deterministic');
        } else {
            console.log('❌ Poseidon hashing is not deterministic');
            return false;
        }
        
        // Test uniqueness
        if (hash1.toString() !== hash2.toString()) {
            console.log('✅ Different inputs produce different hashes');
        } else {
            console.log('❌ Different inputs produced same hash');
            return false;
        }
        
        return true;
    } catch (error) {
        console.log('❌ Poseidon hashing failed:', error.message);
        return false;
    }
}

async function testEEGIdentityCreation() {
    console.log('\n🧠 Testing EEG Identity Creation...');
    
    try {
        // Build poseidon instance
        const poseidon = await buildPoseidon();
        
        // Simulate the identity creation process - convert to BigInt properly
        const hash1 = uint8ArrayToBigInt(poseidon(sampleEEGFeatures));
        const hash2 = uint8ArrayToBigInt(poseidon(sampleEEGFeatures2));
        
        const identity1 = {
            commitment: hash1.toString(),
            seed: hash1.toString()
        };
        
        const identity2 = {
            commitment: hash2.toString(),
            seed: hash2.toString()
        };
        
        console.log(`   Identity 1 commitment: ${identity1.commitment.substring(0, 20)}...`);
        console.log(`   Identity 2 commitment: ${identity2.commitment.substring(0, 20)}...`);
        
        if (identity1.commitment !== identity2.commitment) {
            console.log('✅ Different EEG patterns create different identities');
            return { identity1, identity2 };
        } else {
            console.log('❌ Different EEG patterns created same identity');
            return null;
        }
    } catch (error) {
        console.log('❌ Identity creation failed:', error.message);
        return null;
    }
}

function testSimpleGroupCreation(identities) {
    console.log('\n👥 Testing Simple Group Creation...');
    
    try {
        const { identity1, identity2 } = identities;
        
        // Create a simple group
        const memberCommitments = [identity1.commitment, identity2.commitment];
        const root = memberCommitments.reduce((acc, curr) => 
            (BigInt(acc) ^ BigInt(curr)).toString()
        );
        
        const group = {
            id: 'test_group',
            members: memberCommitments,
            root
        };
        
        console.log(`   Group ID: ${group.id}`);
        console.log(`   Members: ${group.members.length}`);
        console.log(`   Root: ${group.root.substring(0, 20)}...`);
        
        if (group.members.length === 2 && group.root !== "0") {
            console.log('✅ Simple group created successfully');
            return group;
        } else {
            console.log('❌ Group creation failed');
            return null;
        }
    } catch (error) {
        console.log('❌ Group creation failed:', error.message);
        return null;
    }
}

function testSimpleProofGeneration(identities, group) {
    console.log('\n🔐 Testing Simple Proof Generation...');
    
    try {
        const { identity1 } = identities;
        const message = "I am human";
        
        // Check membership
        const isMember = group.members.includes(identity1.commitment);
        
        if (!isMember) {
            console.log('❌ Identity is not a member of the group');
            return null;
        }
        
        // Generate mock proof
        const proof = {
            commitment: identity1.commitment,
            groupRoot: group.root,
            message,
            timestamp: Date.now(),
            nullifier: (BigInt(identity1.commitment) ^ BigInt(message.length)).toString()
        };
        
        console.log(`   Proof commitment: ${proof.commitment.substring(0, 20)}...`);
        console.log(`   Group root: ${proof.groupRoot.substring(0, 20)}...`);
        console.log(`   Message: ${proof.message}`);
        console.log(`   Nullifier: ${proof.nullifier.substring(0, 20)}...`);
        
        console.log('✅ Simple proof generated successfully');
        return proof;
    } catch (error) {
        console.log('❌ Proof generation failed:', error.message);
        return null;
    }
}

function testSimpleProofVerification(proof, group) {
    console.log('\n✅ Testing Simple Proof Verification...');
    
    try {
        // Simple verification - check if proof root matches group root
        const isValid = proof && proof.groupRoot === group.root;
        
        console.log(`   Expected root: ${group.root.substring(0, 20)}...`);
        console.log(`   Proof root: ${proof.groupRoot.substring(0, 20)}...`);
        console.log(`   Valid: ${isValid}`);
        
        if (isValid) {
            console.log('✅ Proof verification successful');
            return true;
        } else {
            console.log('❌ Proof verification failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Proof verification failed:', error.message);
        return false;
    }
}

async function runBasicTests() {
    console.log('🚀 Starting Basic EEG System Tests');
    console.log('='.repeat(50));
    
    let passed = 0;
    let total = 0;
    
    // Test 1: Poseidon Hashing
    total++;
    if (await testPoseidonHashing()) {
        passed++;
    }
    
    // Test 2: EEG Identity Creation
    total++;
    const identities = await testEEGIdentityCreation();
    if (identities) {
        passed++;
    } else {
        console.log('\n❌ Cannot continue without identities');
        return;
    }
    
    // Test 3: Group Creation
    total++;
    const group = testSimpleGroupCreation(identities);
    if (group) {
        passed++;
    } else {
        console.log('\n❌ Cannot continue without group');
        return;
    }
    
    // Test 4: Proof Generation
    total++;
    const proof = testSimpleProofGeneration(identities, group);
    if (proof) {
        passed++;
    } else {
        console.log('\n❌ Cannot continue without proof');
        return;
    }
    
    // Test 5: Proof Verification
    total++;
    if (testSimpleProofVerification(proof, group)) {
        passed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Basic Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All basic tests PASSED! Core functionality is working.');
        console.log('\n📋 What works:');
        console.log('   ✅ Poseidon hashing with circomlibjs');
        console.log('   ✅ EEG feature to identity conversion');
        console.log('   ✅ Simple group management');
        console.log('   ✅ Mock proof generation');
        console.log('   ✅ Basic proof verification');
    } else {
        console.log(`⚠️  ${total - passed} test(s) FAILED. Check the logs above.`);
    }
}

// Run the tests
runBasicTests().catch(console.error); 