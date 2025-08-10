#!/usr/bin/env node

const axios = require('axios');

// Test frontend connectivity to all APIs
async function testFrontendConnectivity() {
  console.log('🔍 Testing Frontend Connectivity to APIs...\n');

  const tests = [
    {
      name: 'Backend API - Token Data',
      url: 'http://localhost:3000/api/token/data',
      expected: 'totalSupply'
    },
    {
      name: 'Backend API - Wallet Info',
      url: 'http://localhost:3000/api/wallet/info',
      expected: 'balance'
    },
    {
      name: 'Backend API - Staking Info',
      url: 'http://localhost:3000/api/staking/info',
      expected: 'userStaked'
    },
    {
      name: 'Backend API - Mining Info',
      url: 'http://localhost:3000/api/mining/info',
      expected: 'isMining'
    },
    {
      name: 'Blockchain API - System Status',
      url: 'http://localhost:8545/api/status',
      expected: 'system'
    },
    {
      name: 'Blockchain API - Network Stats',
      url: 'http://localhost:8545/api/network-stats',
      expected: 'totalNodes'
    },
    {
      name: 'Math Engine API - Engine Distribution',
      url: 'http://localhost:5001/api/engines/distribution',
      expected: 'engines'
    },
    {
      name: 'Math Engine API - Engine Stats',
      url: 'http://localhost:5001/api/engines/stats',
      expected: 'totalEngines'
    },
    {
      name: 'Math Engine API - Mining Status',
      url: 'http://localhost:5001/api/mining/status',
      expected: 'isMining'
    },
    {
      name: 'Math Engine API - Discoveries',
      url: 'http://localhost:5001/api/discoveries',
      expected: 'discoveries'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📡 Testing: ${test.name}`);
      const response = await axios.get(test.url, {
        timeout: 5000,
        headers: {
          'Origin': 'http://localhost:3002',
          'User-Agent': 'ProductiveMiner-Frontend-Test'
        }
      });
      
      if (response.data && response.data[test.expected] !== undefined) {
        console.log(`  ✅ PASS: ${test.name}`);
        console.log(`     Status: ${response.status}`);
        console.log(`     Data: ${JSON.stringify(response.data[test.expected]).substring(0, 50)}...`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: ${test.name} - Missing expected field '${test.expected}'`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ FAIL: ${test.name}`);
      console.log(`     Error: ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Data: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
      }
      failed++;
    }
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Frontend should now be able to connect to all APIs.');
    console.log('💡 Try refreshing the browser and check the dashboards.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }
}

testFrontendConnectivity();
