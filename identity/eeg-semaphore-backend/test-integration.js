// test-integration.js
// Simple integration test for the EEG Merkle Backend APIs

const BASE_URL = 'http://localhost:8000';

// Sample EEG features for testing
const sampleEEGFeatures = [1.23, 4.56, 7.89, 2.34, 5.67, 8.91, 3.45, 6.78];
const sampleEEGFeatures2 = [2.34, 5.67, 8.91, 3.45, 6.78, 1.23, 4.56, 7.89];

async function makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    const result = await makeRequest('/');
    console.log('Result:', result);
    return result.success;
}

async function testIdentityCreation() {
    console.log('\n🧠 Testing Identity Creation...');
    const result = await makeRequest('/api/proof/identity/create', 'POST', {
        eegFeatures: sampleEEGFeatures
    });
    console.log('Result:', result);
    return result.success ? result.data.identityCommitment : null;
}

async function testGroupCreation() {
    console.log('\n👥 Testing Group Creation...');
    const result = await makeRequest('/api/proof/group/create', 'POST', {
        groupId: 'test_group_' + Date.now(),
        memberEEGFeatures: [sampleEEGFeatures, sampleEEGFeatures2]
    });
    console.log('Result:', result);
    return result.success ? result.data.groupId : null;
}

async function testAddMemberToGroup(groupId) {
    console.log('\n➕ Testing Add Member to Group...');
    const newMemberFeatures = [3.45, 6.78, 1.23, 4.56, 7.89, 2.34, 5.67, 8.91];
    const result = await makeRequest(`/api/proof/group/${groupId}/member/add`, 'POST', {
        eegFeatures: newMemberFeatures
    });
    console.log('Result:', result);
    return result.success;
}

async function testGetGroupInfo(groupId) {
    console.log('\n📊 Testing Get Group Info...');
    const result = await makeRequest(`/api/proof/group/${groupId}`);
    console.log('Result:', result);
    return result.success;
}

async function testListGroups() {
    console.log('\n📋 Testing List All Groups...');
    const result = await makeRequest('/api/proof/groups');
    console.log('Result:', result);
    return result.success;
}

async function testHumanityProof(groupId) {
    console.log('\n🤖 Testing Humanity Proof Generation...');
    const result = await makeRequest('/api/proof/humanity', 'POST', {
        eegFeatures: sampleEEGFeatures,
        groupId: groupId,
        message: 'I am human - test'
    });
    console.log('Result:', result);
    return result.success ? result.data : null;
}

async function testVoteProof(groupId) {
    console.log('\n🗳️ Testing Vote Proof Generation...');
    const result = await makeRequest('/api/proof/vote', 'POST', {
        eegFeatures: sampleEEGFeatures,
        groupId: groupId,
        vote: 'option_A',
        pollId: 'test_poll_001'
    });
    console.log('Result:', result);
    return result.success ? result.data : null;
}

async function testProofVerification(proofData) {
    console.log('\n✅ Testing Proof Verification...');
    if (!proofData) {
        console.log('❌ No proof data to verify');
        return false;
    }
    
    const result = await makeRequest('/api/proof/verify', 'POST', {
        proof: proofData.proof,
        merkleTreeRoot: proofData.merkleTreeRoot,
        signal: proofData.signal,
        externalNullifier: proofData.externalNullifier,
        nullifierHash: proofData.nullifierHash
    });
    console.log('Result:', result);
    return result.success && result.data.valid;
}

async function runFullTest() {
    console.log('🚀 Starting EEG Merkle Backend Integration Test');
    console.log('='.repeat(50));
    
    let passed = 0;
    let total = 0;
    
    // Test 1: Health Check
    total++;
    if (await testHealthCheck()) {
        console.log('✅ Health Check: PASSED');
        passed++;
    } else {
        console.log('❌ Health Check: FAILED');
    }
    
    // Test 2: Identity Creation
    total++;
    const identityCommitment = await testIdentityCreation();
    if (identityCommitment) {
        console.log('✅ Identity Creation: PASSED');
        console.log(`   Identity Commitment: ${identityCommitment.substring(0, 20)}...`);
        passed++;
    } else {
        console.log('❌ Identity Creation: FAILED');
    }
    
    // Test 3: Group Creation
    total++;
    const groupId = await testGroupCreation();
    if (groupId) {
        console.log('✅ Group Creation: PASSED');
        console.log(`   Group ID: ${groupId}`);
        passed++;
    } else {
        console.log('❌ Group Creation: FAILED');
        return;
    }
    
    // Test 4: Add Member to Group
    total++;
    if (await testAddMemberToGroup(groupId)) {
        console.log('✅ Add Member to Group: PASSED');
        passed++;
    } else {
        console.log('❌ Add Member to Group: FAILED');
    }
    
    // Test 5: Get Group Info
    total++;
    if (await testGetGroupInfo(groupId)) {
        console.log('✅ Get Group Info: PASSED');
        passed++;
    } else {
        console.log('❌ Get Group Info: FAILED');
    }
    
    // Test 6: List Groups
    total++;
    if (await testListGroups()) {
        console.log('✅ List Groups: PASSED');
        passed++;
    } else {
        console.log('❌ List Groups: FAILED');
    }
    
    // Test 7: Humanity Proof
    total++;
    const humanityProof = await testHumanityProof(groupId);
    if (humanityProof) {
        console.log('✅ Humanity Proof Generation: PASSED');
        passed++;
    } else {
        console.log('❌ Humanity Proof Generation: FAILED');
    }
    
    // Test 8: Vote Proof
    total++;
    const voteProof = await testVoteProof(groupId);
    if (voteProof) {
        console.log('✅ Vote Proof Generation: PASSED');
        passed++;
    } else {
        console.log('❌ Vote Proof Generation: FAILED');
    }
    
    // Test 9: Proof Verification (Humanity)
    total++;
    if (await testProofVerification(humanityProof)) {
        console.log('✅ Humanity Proof Verification: PASSED');
        passed++;
    } else {
        console.log('❌ Humanity Proof Verification: FAILED');
    }
    
    // Test 10: Proof Verification (Vote)
    total++;
    if (await testProofVerification(voteProof)) {
        console.log('✅ Vote Proof Verification: PASSED');
        passed++;
    } else {
        console.log('❌ Vote Proof Verification: FAILED');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests PASSED! Backend integration is working correctly.');
    } else {
        console.log(`⚠️  ${total - passed} test(s) FAILED. Check the logs above for details.`);
    }
    
    console.log('\n💡 To run this test:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Run this test: node test-integration.js');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.log('❌ This test requires Node.js 18+ or you need to install node-fetch');
    console.log('Install with: npm install node-fetch');
    console.log('Then add: const fetch = require("node-fetch");');
} else {
    runFullTest().catch(console.error);
} 