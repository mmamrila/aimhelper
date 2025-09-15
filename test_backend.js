/**
 * Backend API Test Script
 * Quick test of all major endpoints
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(url, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${url}`, options);
        const data = await response.text();

        console.log(`✓ ${options.method || 'GET'} ${url}: ${response.status}`);

        if (response.headers.get('content-type')?.includes('application/json')) {
            return JSON.parse(data);
        }
        return data;
    } catch (error) {
        console.log(`✗ ${options.method || 'GET'} ${url}: ${error.message}`);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Testing AimHelper Pro Backend API\n');

    // Test health endpoint
    const health = await testEndpoint('/health');

    // Test API status
    const status = await testEndpoint('/api/status');

    // Test auth endpoints
    console.log('\n📝 Testing Authentication:');

    // Test registration
    const registerData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123'
    };

    const register = await testEndpoint('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
    });

    let token = null;
    if (register && register.token) {
        token = register.token;
        console.log('  → Registration successful, token received');
    }

    // Test login
    const login = await testEndpoint('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emailOrUsername: registerData.email,
            password: registerData.password
        })
    });

    if (login && login.token && !token) {
        token = login.token;
        console.log('  → Login successful, token received');
    }

    // Test protected endpoints with token
    if (token) {
        console.log('\n🔒 Testing Protected Endpoints:');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test user profile
        await testEndpoint('/api/users/profile', { headers: authHeaders });

        // Test user stats
        await testEndpoint('/api/users/stats', { headers: authHeaders });

        // Test training submission
        const trainingData = {
            testMode: 'gridshot',
            difficulty: 'medium',
            duration: 60,
            targetSize: 'medium',
            score: 1500,
            accuracy: 85.5,
            totalShots: 100,
            totalHits: 85,
            totalMisses: 15,
            averageReactionTime: 250,
            killsPerSecond: 1.5,
            consistency: 78.2,
            streakBest: 12
        };

        await testEndpoint('/api/training/results', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(trainingData)
        });

        // Test training results retrieval
        await testEndpoint('/api/training/results', { headers: authHeaders });

        // Test analytics
        await testEndpoint('/api/analytics/dashboard', { headers: authHeaders });
    }

    // Test public endpoints
    console.log('\n🌐 Testing Public Endpoints:');

    // Test leaderboard
    await testEndpoint('/api/leaderboard');

    // Test leaderboard by test mode
    await testEndpoint('/api/leaderboard/testmode/gridshot');

    // Test pricing (payment placeholder)
    await testEndpoint('/api/payments/pricing');

    console.log('\n✅ Backend API test completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };