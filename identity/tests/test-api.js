// test-api.js
// Simple test for the backend API

async function testAPI() {
    const BASE_URL = 'http://localhost:8000';
    
    console.log('🔍 Testing Backend API...');
    
    try {
        // Test 1: Health check
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await fetch(`${BASE_URL}/api/proof/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health:', healthData);
        
        // Test 2: Identity creation
        console.log('\n2. Testing identity creation...');
        const identityResponse = await fetch(`${BASE_URL}/api/proof/identity/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eegFeatures: [1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8]
            })
        });
        
        if (!identityResponse.ok) {
            console.log('❌ Identity creation failed:', identityResponse.status, identityResponse.statusText);
            const text = await identityResponse.text();
            console.log('Response:', text);
        } else {
            const identityData = await identityResponse.json();
            console.log('✅ Identity created:', identityData);
        }
        
        // Test 3: Group creation
        console.log('\n3. Testing group creation...');
        const groupResponse = await fetch(`${BASE_URL}/api/proof/group/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                groupId: 'test-group-1',
                memberEEGFeatures: [
                    [1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8],
                    [2.1, 3.2, 4.3, 5.4, 6.5, 7.6, 8.7, 9.8]
                ]
            })
        });
        
        if (!groupResponse.ok) {
            console.log('❌ Group creation failed:', groupResponse.status, groupResponse.statusText);
            const text = await groupResponse.text();
            console.log('Response:', text);
        } else {
            const groupData = await groupResponse.json();
            console.log('✅ Group created:', groupData);
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testAPI(); 