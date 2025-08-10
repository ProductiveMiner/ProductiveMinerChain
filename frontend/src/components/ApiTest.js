import React, { useState, useEffect } from 'react';
import { backendServices, mathematicalServices } from '../services/api';

const ApiTest = () => {
  const [backendStatus, setBackendStatus] = useState('Testing...');
  const [engineStatus, setEngineStatus] = useState('Testing...');
  const [computationResult, setComputationResult] = useState(null);

  useEffect(() => {
    // Test backend API
    backendServices.healthCheck()
      .then(response => {
        setBackendStatus('✅ Backend API Connected');
        console.log('Backend API Response:', response.data);
      })
      .catch(error => {
        setBackendStatus('❌ Backend API Error: ' + error.message);
        console.error('Backend API Error:', error);
      });

    // Test mathematical engine
    mathematicalServices.healthCheck()
      .then(response => {
        setEngineStatus('✅ Mathematical Engine Connected');
        console.log('Mathematical Engine Response:', response.data);
      })
      .catch(error => {
        setEngineStatus('❌ Mathematical Engine Error: ' + error.message);
        console.error('Mathematical Engine Error:', error);
      });
  }, []);

  const testComputation = async () => {
    try {
      const result = await mathematicalServices.computePrimePatterns({
        limit: 1000
      });
      setComputationResult(result.data);
    } catch (error) {
      console.error('Computation Error:', error);
      setComputationResult({ error: error.message });
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', margin: '20px 0' }}>
      <h3>🔗 API Connection Test</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Backend API:</strong> {backendStatus}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Mathematical Engine:</strong> {engineStatus}
      </div>
      <button 
        onClick={testComputation}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Prime Pattern Computation
      </button>
      {computationResult && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
          <strong>Computation Result:</strong>
          <pre>{JSON.stringify(computationResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
