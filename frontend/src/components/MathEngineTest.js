import React, { useState, useEffect } from 'react';
import mathEngineService from '../services/mathEngineService';

const MathEngineTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setConnectionStatus('Connecting...');
      const connected = await mathEngineService.initialize();
      setConnectionStatus(connected ? 'Connected' : 'Failed to connect');
    } catch (error) {
      setConnectionStatus(`Error: ${error.message}`);
    }
  };

  const runTest = async (testName, testFunction) => {
    setIsLoading(true);
    try {
      const result = await testFunction();
      setTestResults(prev => [...prev, {
        test: testName,
        status: 'Success',
        result: result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: testName,
        status: 'Error',
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    }
    setIsLoading(false);
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    // Test a selection of work types from each category
    // Millennium Problems
    await runTest('Riemann Zeros', () => 
      mathEngineService.computeRiemannZeros(5)
    );
    
    await runTest('Yang-Mills Theory', () => 
      mathEngineService.computeYangMills()
    );
    
    // Major Theorems
    await runTest('Goldbach Conjecture', () => 
      mathEngineService.computeGoldbach(100)
    );
    
    // Advanced Research
    await runTest('Prime Pattern Discovery', () => 
      mathEngineService.computePrimePatterns(100)
    );
    
    await runTest('Quantum Computing', () => 
      mathEngineService.computeQuantumComputing()
    );
    
    // Applied Research
    await runTest('Machine Learning', () => 
      mathEngineService.computeMachineLearning()
    );
    
    await runTest('Elliptic Curve Crypto', () => 
      mathEngineService.computeEllipticCurveCrypto()
    );
    
    // Basic Research
    await runTest('Fibonacci Patterns', () => 
      mathEngineService.computeFibonacciPatterns(100)
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Connected': return 'text-green-600';
      case 'Failed to connect': return 'text-red-600';
      case 'Checking...': return 'text-yellow-600';
      case 'Connecting...': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Math Engine Connection Test</h2>
      
      {/* Connection Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        <div className={`text-lg ${getStatusColor(connectionStatus)}`}>
          {connectionStatus}
        </div>
        <button 
          onClick={checkConnection}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Connection
        </button>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Test Computations</h3>
        <button 
          onClick={runAllTests}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Test Results */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Test Results</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <strong>{result.test}</strong>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      result.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                {result.status === 'Success' ? (
                  <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                ) : (
                  <div className="mt-2 text-sm text-red-600">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Work Types - All 25 organized by category */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">All 25 Mathematical Work Types</h3>
        
        {/* Millennium Problems */}
        <div className="mb-4">
          <h4 className="font-semibold text-purple-700 mb-2">🏆 Millennium Problems (5 Types)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mathEngineService.getAvailableWorkTypes()
              .filter(wt => wt.category === 'Millennium Problems')
              .map((workType) => (
                <div key={workType.id} className="border border-purple-200 rounded p-2 bg-purple-50">
                  <div className="font-medium">{workType.name}</div>
                  <div className="text-sm text-gray-600">{workType.description}</div>
                  <div className="text-xs text-purple-600">Base Reward: {workType.baseReward} MINED</div>
                </div>
              ))}
          </div>
        </div>

        {/* Advanced Research */}
        <div className="mb-4">
          <h4 className="font-semibold text-blue-700 mb-2">🔬 Advanced Research (8 Types)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mathEngineService.getAvailableWorkTypes()
              .filter(wt => wt.category === 'Advanced Research')
              .map((workType) => (
                <div key={workType.id} className="border border-blue-200 rounded p-2 bg-blue-50">
                  <div className="font-medium">{workType.name}</div>
                  <div className="text-sm text-gray-600">{workType.description}</div>
                  <div className="text-xs text-blue-600">Base Reward: {workType.baseReward} MINED</div>
                </div>
              ))}
          </div>
        </div>

        {/* Applied Research */}
        <div className="mb-4">
          <h4 className="font-semibold text-green-700 mb-2">🔧 Applied Research (6 Types)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mathEngineService.getAvailableWorkTypes()
              .filter(wt => wt.category === 'Applied Research')
              .map((workType) => (
                <div key={workType.id} className="border border-green-200 rounded p-2 bg-green-50">
                  <div className="font-medium">{workType.name}</div>
                  <div className="text-sm text-gray-600">{workType.description}</div>
                  <div className="text-xs text-green-600">Base Reward: {workType.baseReward} MINED</div>
                </div>
              ))}
          </div>
        </div>

        {/* Other Categories */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">📚 Other Categories (6 Types)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mathEngineService.getAvailableWorkTypes()
              .filter(wt => !['Millennium Problems', 'Advanced Research', 'Applied Research'].includes(wt.category))
              .map((workType) => (
                <div key={workType.id} className="border border-gray-200 rounded p-2 bg-gray-50">
                  <div className="font-medium">{workType.name}</div>
                  <div className="text-sm text-gray-600">{workType.description}</div>
                  <div className="text-xs text-gray-600">Base Reward: {workType.baseReward} MINED</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathEngineTest;
