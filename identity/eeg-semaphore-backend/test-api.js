// test-api.js
// Test the API endpoints

const BASE_URL = 'http://localhost:8000';

// Sample EEG features for testing
const sampleEEGFeatures = [123, 456, 789, 234, 567, 891, 345, 678];
const sampleEEGFeatures2 = [234, 567, 891, 345, 678, 123, 456, 789];

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
    console.log('🔍 Testing Health Check...');
    const result = await makeRequest('/');
    console.log('Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    if (result.success) {
        console.log('   Response:', result.data.response);
    } else {
        console.log('   Error:', result.error || result.data);
    }
    return result.success;
}

async function testIdentityCreation() {
    console.log('\n🧠 Testing Identity Creation...');
    const result = await makeRequest('/api/proof-simple/identity/create', 'POST', {
        eegFeatures: sampleEEGFeatures
    });
    console.log('Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    if (result.success) {
        console.log('   Identity:', result.data.identity.commitment.substring(0, 20) + '...');
        return result.data.identity;
    } else {
        console.log('   Error:', result.error || result.data);
        return null;
    }
}

async function testGroupCreation() {
    console.log('\n👥 Testing Group Creation...');
    const groupId = 'test_group_' + Date.now();
    const result = await makeRequest('/api/proof-simple/group/create', 'POST', {
        groupId: groupId,
        memberEEGFeatures: [sampleEEGFeatures, sampleEEGFeatures2]
    });
    console.log('Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    if (result.success) {
        console.log('   Group ID:', result.data.group.id);
        console.log('   Members:', result.data.group.members.length);
        return result.data.group;
    } else {
        console.log('   Error:', result.error || result.data);
        return null;
    }
}

async function testProofGeneration(group) {
    console.log('\n🔐 Testing Proof Generation...');
    const result = await makeRequest('/api/proof-simple/proof/generate', 'POST', {
        eegFeatures: sampleEEGFeatures,
        groupId: group.id,
        message: 'API test proof'
    });
    console.log('Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    if (result.success) {
        console.log('   Proof generated with message:', result.data.proof.message);
        return result.data.proof;
    } else {
        console.log('   Error:', result.error || result.data);
        return null;
    }
}

async function testProofVerification(proof, group) {
    console.log('\n✅ Testing Proof Verification...');
    const result = await makeRequest('/api/proof-simple/proof/verify', 'POST', {
        proof: proof,
        groupId: group.id
    });
    console.log('Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    if (result.success) {
        console.log('   Proof valid:', result.data.valid);
        return result.data.valid;
    } else {
        console.log('   Error:', result.error || result.data);
        return false;
    }
}

async function testGetGroupInfo(group) {
    console.log('\n📊 Testing Get Group Info...');
    const result = await makeRequest(`/api/proof-simple/group/${group.id}`);
    console.log('Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    if (result.success) {
        console.log('   Group members:', result.data.group.members.length);
        return true;
    } else {
        console.log('   Error:', result.error || result.data);
        return false;
    }
}

async function testListGroups() {
    console.log('\n📋 Testing List Groups...');
    const result = await makeRequest('/api/proof-simple/groups');
    console.log('Result:', result.success ? '✅ PASSED' : '❌ FAILED');
    if (result.success) {
        console.log('   Total groups:', result.data.totalGroups);
        return true;
    } else {
        console.log('   Error:', result.error || result.data);
        return false;
    }
}

async function runAPITests() {
    console.log('🚀 Starting API Tests');
    console.log('='.repeat(50));
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let passed = 0;
    let total = 0;
    
    // Test 1: Health Check
    total++;
    if (await testHealthCheck()) {
        passed++;
    }
    
    // Test 2: Identity Creation
    total++;
    const identity = await testIdentityCreation();
    if (identity) {
        passed++;
    }
    
    // Test 3: Group Creation
    total++;
    const group = await testGroupCreation();
    if (group) {
        passed++;
    } else {
        console.log('\n❌ Cannot continue without group');
        return;
    }
    
    // Test 4: Proof Generation
    total++;
    const proof = await testProofGeneration(group);
    if (proof) {
        passed++;
    } else {
        console.log('\n❌ Cannot continue without proof');
        return;
    }
    
    // Test 5: Proof Verification
    total++;
    if (await testProofVerification(proof, group)) {
        passed++;
    }
    
    // Test 6: Get Group Info
    total++;
    if (await testGetGroupInfo(group)) {
        passed++;
    }
    
    // Test 7: List Groups
    total++;
    if (await testListGroups()) {
        passed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 API Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All API tests PASSED! Backend is working correctly.');
    } else {
        console.log(`⚠️  ${total - passed} test(s) FAILED. Check the logs above.`);
    }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.log('❌ This test requires Node.js 18+ or you need to install node-fetch');
    console.log('For Node.js < 18, install with: npm install node-fetch');
    console.log('Then add: const fetch = require("node-fetch");');
} else {
    runAPITests().catch(console.error);
} 