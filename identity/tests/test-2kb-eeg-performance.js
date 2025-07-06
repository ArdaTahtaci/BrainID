const axios = require('axios');

// Generate 2KB of random EEG data
function generateLargeEEGData(size = 256) {
    const features = [];
    for (let i = 0; i < size; i++) {
        features.push(Math.random() * 200 - 100); // -100 to 100 μV
    }
    return features;
}

async function testWorkingFlow() {
    console.log('🎯 2KB EEG Data - Working Flow Test\n');

    const backendUrl = 'http://localhost:8000';

    // Test different sizes
    const testSizes = [
        { name: '2KB (256 features)', size: 256 },
        { name: '1KB (128 features)', size: 128 },
        { name: '512B (64 features)', size: 64 },
        { name: '256B (32 features)', size: 32 },
        { name: '128B (16 features)', size: 16 },
        { name: '64B (8 features)', size: 8 },
        { name: '32B (5 features)', size: 5 }
    ];

    console.log('📊 Performance Test Results:\n');

    for (const test of testSizes) {
        const features = generateLargeEEGData(test.size);
        const dataSize = JSON.stringify(features).length;

        console.log(`🔍 Testing ${test.name} (${dataSize} bytes)...`);

        try {
            // 1. Test Identity Creation
            const identityStart = Date.now();
            const identityResponse = await axios.post(`${backendUrl}/api/proof/identity/create`, {
                eegFeatures: features
            });
            const identityTime = Date.now() - identityStart;

            console.log(`  ✅ Identity: ${identityTime}ms`);
            console.log(`     Commitment: ${identityResponse.data.identityCommitment.slice(0, 20)}...`);

            // 2. Test Group Creation
            const groupStart = Date.now();
            const groupResponse = await axios.post(`${backendUrl}/api/proof/group/create`, {
                groupId: `test-group-${test.size}`,
                memberEEGFeatures: [features]
            });
            const groupTime = Date.now() - groupStart;

            console.log(`  ✅ Group: ${groupTime}ms`);
            console.log(`     Members: ${groupResponse.data.memberCount}`);

            // 3. Test Add Member
            const newMemberFeatures = generateLargeEEGData(test.size);
            const memberStart = Date.now();
            const memberResponse = await axios.post(`${backendUrl}/api/proof/group/add-member`, {
                groupId: `test-group-${test.size}`,
                memberEEGFeatures: newMemberFeatures
            });
            const memberTime = Date.now() - memberStart;

            console.log(`  ✅ Add Member: ${memberTime}ms`);
            console.log(`     New Count: ${memberResponse.data.memberCount}`);

            // 4. Test Humanity Proof
            const proofStart = Date.now();
            const proofResponse = await axios.post(`${backendUrl}/api/proof/humanity`, {
                eegFeatures: features,
                groupId: `test-group-${test.size}`,
                message: `Test message for ${test.size} features`
            });
            const proofTime = Date.now() - proofStart;

            console.log(`  ✅ Proof: ${proofTime}ms`);
            console.log(`     Success: ${proofResponse.data.success}`);
            console.log(`     Root: ${proofResponse.data.merkleTreeRoot?.slice(0, 20)}...`);

            // Summary
            const totalTime = identityTime + groupTime + memberTime + proofTime;
            console.log(`  📈 Total: ${totalTime}ms`);
            console.log(`  ⚡ Speed: ${(dataSize / totalTime * 1000).toFixed(0)} bytes/sec\n`);

        } catch (error) {
            console.log(`  ❌ Failed: ${error.message}`);
            if (error.response?.data?.error) {
                console.log(`     Error: ${error.response.data.error}`);
            }
            console.log('');
        }
    }
}

// Test specific 2KB scenario
async function test2KBScenario() {
    console.log('🚀 2KB EEG Data - Real World Scenario\n');

    const eegFeatures = generateLargeEEGData(256); // 2KB
    const dataSize = JSON.stringify(eegFeatures).length;

    console.log(`📊 EEG Data: ${eegFeatures.length} features (${dataSize} bytes)`);
    console.log(`📋 Sample: [${eegFeatures.slice(0, 3).map(f => f.toFixed(2)).join(', ')}...]`);
    console.log('');

    try {
        // Simulate real verification flow
        console.log('🔐 Step 1: Creating Identity from EEG...');
        const identityStart = Date.now();
        const identity = await axios.post('http://localhost:8000/api/proof/identity/create', {
            eegFeatures: eegFeatures
        });
        const identityTime = Date.now() - identityStart;
        console.log(`✅ Identity created in ${identityTime}ms`);
        console.log(`   Commitment: ${identity.data.identityCommitment}`);

        console.log('\n👥 Step 2: Creating verification group...');
        const groupStart = Date.now();
        const group = await axios.post('http://localhost:8000/api/proof/group/create', {
            groupId: 'eeg-verification-group',
            memberEEGFeatures: [eegFeatures]
        });
        const groupTime = Date.now() - groupStart;
        console.log(`✅ Group created in ${groupTime}ms`);
        console.log(`   Group ID: ${group.data.groupId}`);
        console.log(`   Members: ${group.data.memberCount}`);

        console.log('\n🔍 Step 3: Generating humanity proof...');
        const proofStart = Date.now();
        const proof = await axios.post('http://localhost:8000/api/proof/humanity', {
            eegFeatures: eegFeatures,
            groupId: 'eeg-verification-group',
            message: 'I am a verified human using EEG biometrics'
        });
        const proofTime = Date.now() - proofStart;
        console.log(`✅ Proof generated in ${proofTime}ms`);
        console.log(`   Success: ${proof.data.success}`);
        console.log(`   Signal: ${proof.data.signal}`);
        console.log(`   Nullifier: ${proof.data.nullifierHash?.slice(0, 20)}...`);

        // Final summary
        const totalTime = identityTime + groupTime + proofTime;
        console.log('\n📈 Performance Summary:');
        console.log(`• Data size: ${dataSize} bytes (${eegFeatures.length} features)`);
        console.log(`• Identity creation: ${identityTime}ms`);
        console.log(`• Group creation: ${groupTime}ms`);
        console.log(`• Proof generation: ${proofTime}ms`);
        console.log(`• Total verification time: ${totalTime}ms`);
        console.log(`• Processing speed: ${(dataSize / totalTime * 1000).toFixed(0)} bytes/sec`);

        if (totalTime < 2000) {
            console.log('🎉 EXCELLENT: Under 2 seconds for 2KB EEG verification!');
        } else if (totalTime < 5000) {
            console.log('👍 GOOD: Under 5 seconds for 2KB EEG verification');
        } else {
            console.log('⚠️  SLOW: Over 5 seconds for 2KB EEG verification');
        }

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        if (error.response?.data) {
            console.log(`Error details: ${error.response.data.error || error.response.data}`);
        }
    }
}

if (require.main === module) {
    test2KBScenario()
        .then(() => {
            console.log('\n' + '='.repeat(50));
            return testWorkingFlow();
        })
        .then(() => {
            console.log('✅ All 2KB EEG tests completed!');
        })
        .catch(console.error);
}

module.exports = { generateLargeEEGData, test2KBScenario }; 